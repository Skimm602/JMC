'use server'

import { createClient } from '@/utils/supabase/server'
import { readAdminSession } from '@/utils/admin-session'

/**
 * The catalogue and what is left of it.
 *
 * Stock is counted per model, not per family: a customer orders an H6K-LS or
 * an H8K-LS, never an "H-LS Series", and the shelf knows the difference.
 *
 * Writes go through set_product_stock() rather than updating the row, so the
 * question of who may change a stock level is answered once, in the database,
 * for every caller rather than for this one.
 */

/** Public — the site can read the catalogue without being anybody. */
export async function getProducts() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('id, model, name, family, photo, stock, is_active, updated_at')
    .order('family', { ascending: true })
    .order('model', { ascending: true })

  if (error) return { error: error.message }
  return { data }
}

/**
 * setStock(model, stock)
 *
 * Admin only, enforced in the database. `stock` is the new absolute count
 * rather than a delta — the person typing it is looking at a shelf, not
 * doing arithmetic about one.
 */
export async function setStock(model, stock) {
  const supabase = await createClient()

  const value = Number(stock)
  if (!Number.isInteger(value) || value < 0) {
    return { error: 'Enter a whole number, zero or more.' }
  }

  const { data: changed, error } = await supabase.rpc('set_product_stock', {
    p_model: model,
    p_stock: value,
  })

  if (error) return { error: error.message }
  if (!changed) return { error: 'That product is not in the catalogue.' }

  return { success: true, stock: value }
}

/**
 * setStockBulk(entries)
 *
 * entries: [{ model, stock }]
 *
 * A stock count is done in one pass down the shelves, so the page saves in one
 * pass too. Each row is reported on individually: one bad number should not
 * throw away the twenty that were fine.
 */
export async function setStockBulk(entries) {
  const { isAdmin } = await readAdminSession()
  if (!isAdmin) return { error: 'Not authorized' }

  const results = await Promise.all(
    (entries ?? []).map(async ({ model, stock }) => {
      const result = await setStock(model, stock)
      return { model, ...result }
    }),
  )

  const failed = results.filter((r) => r.error)
  return { success: failed.length === 0, results, failed }
}
