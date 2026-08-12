'use server'

import { createClient } from '@/utils/supabase/server'
import { readAdminSession } from '@/utils/admin-session'

/**
 * The catalogue, and the admin's full control over it.
 *
 * Reads are public — the storefront needs the catalogue without being
 * anybody. Writes go through the "Admins manage products" RLS policy
 * (supabase-admin-orders-products.sql), so the database refuses a non-admin
 * regardless of what this layer does or forgets to check.
 */

/** Public — the site can read the catalogue without being anybody. */
export async function getProducts() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, retail_price, installer_price, is_bulk_only, stock_quantity, image_url, is_active, created_at')
    .order('name', { ascending: true })

  if (error) return { error: error.message }
  return { data }
}

function readProductFields(fields) {
  const name = String(fields?.name ?? '').trim()
  const retailPrice = Number(fields?.retail_price)

  if (!name) return { error: 'Name is required.' }
  if (!Number.isFinite(retailPrice) || retailPrice < 0) return { error: 'Enter a valid retail price.' }

  const installerPriceRaw = fields?.installer_price
  const installerPrice =
    installerPriceRaw === '' || installerPriceRaw == null ? null : Number(installerPriceRaw)
  if (installerPrice != null && (!Number.isFinite(installerPrice) || installerPrice < 0)) {
    return { error: 'Installer price must be a valid number, or left blank.' }
  }

  const stockQuantity = Number(fields?.stock_quantity ?? 0)
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    return { error: 'Stock must be a whole number, zero or more.' }
  }

  return {
    row: {
      name,
      description: fields?.description?.trim() || null,
      retail_price: retailPrice,
      installer_price: installerPrice,
      stock_quantity: stockQuantity,
      image_url: fields?.image_url?.trim() || null,
      is_bulk_only: Boolean(fields?.is_bulk_only),
    },
  }
}

/**
 * createProduct(fields)
 *
 * fields: { name, description?, retail_price, installer_price?, stock_quantity?, image_url?, is_bulk_only? }
 */
export async function createProduct(fields) {
  const { supabase, isAdmin } = await readAdminSession()
  if (!isAdmin) return { error: 'Not authorized' }

  const { row, error: validationError } = readProductFields(fields)
  if (validationError) return { error: validationError }

  const { data, error } = await supabase.from('products').insert(row).select('id').single()
  if (error) return { error: error.message }

  return { success: true, id: data.id }
}

/**
 * updateProduct(id, fields)
 *
 * Same shape as createProduct — the whole editable row, not a partial patch,
 * so the form and the database always agree on what a product is.
 */
export async function updateProduct(id, fields) {
  const { supabase, isAdmin } = await readAdminSession()
  if (!isAdmin) return { error: 'Not authorized' }

  const { row, error: validationError } = readProductFields(fields)
  if (validationError) return { error: validationError }

  const { error } = await supabase.from('products').update(row).eq('id', id)
  if (error) return { error: error.message }

  return { success: true }
}

/**
 * setStock(id, stock)
 *
 * The fast path for a shelf count: one number, not the rest of the row.
 */
export async function setStock(id, stock) {
  const { supabase, isAdmin } = await readAdminSession()
  if (!isAdmin) return { error: 'Not authorized' }

  const value = Number(stock)
  if (!Number.isInteger(value) || value < 0) {
    return { error: 'Enter a whole number, zero or more.' }
  }

  const { error } = await supabase.from('products').update({ stock_quantity: value }).eq('id', id)
  if (error) return { error: error.message }

  return { success: true, stock: value }
}

/**
 * setStockBulk(entries)
 *
 * entries: [{ id, stock }]
 *
 * A stock count is done in one pass down the shelves, so the page saves in
 * one pass too. Each row is reported on individually: one bad number should
 * not throw away the twenty that were fine.
 */
export async function setStockBulk(entries) {
  const { isAdmin } = await readAdminSession()
  if (!isAdmin) return { error: 'Not authorized' }

  const results = await Promise.all(
    (entries ?? []).map(async ({ id, stock }) => {
      const result = await setStock(id, stock)
      return { id, ...result }
    }),
  )

  const failed = results.filter((r) => r.error)
  return { success: failed.length === 0, results, failed }
}

/**
 * setProductActive(id, isActive)
 *
 * Reactivating a discontinued product, or pulling one without deleting it.
 */
export async function setProductActive(id, isActive) {
  const { supabase, isAdmin } = await readAdminSession()
  if (!isAdmin) return { error: 'Not authorized' }

  const { error } = await supabase.from('products').update({ is_active: Boolean(isActive) }).eq('id', id)
  if (error) return { error: error.message }

  return { success: true }
}

/**
 * deleteProduct(id)
 *
 * A product nobody has ever ordered is gone outright. One with order history
 * behind it can't be — order_items still points at it, and an order is a
 * record of what was agreed, not a live view of the catalogue — so the
 * database refuses the delete (foreign key violation, 23503) and this falls
 * back to deactivating it instead. Either way the admin gets "removed" from
 * the list they're looking at.
 */
export async function deleteProduct(id) {
  const { supabase, isAdmin } = await readAdminSession()
  if (!isAdmin) return { error: 'Not authorized' }

  const { error } = await supabase.from('products').delete().eq('id', id)

  if (error) {
    if (error.code === '23503') {
      const fallback = await setProductActive(id, false)
      if (fallback.error) return { error: fallback.error }
      return { success: true, deactivated: true }
    }
    return { error: error.message }
  }

  return { success: true, deleted: true }
}
