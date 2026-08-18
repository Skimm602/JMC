'use server'

import { createClient } from '@/utils/supabase/server'
import { readAdminSession } from '@/utils/admin-session'
import { hasInstallerPricing } from '@/utils/pricing'

const IMAGE_BUCKET = 'product-images'
const DOCUMENT_BUCKET = 'product-documents'

/**
 * The catalogue, and the admin's full control over it.
 *
 * Reads are public — the storefront needs the catalogue without being
 * anybody. Writes go through the "Admins manage products" RLS policy
 * (supabase-admin-orders-products.sql), so the database refuses a non-admin
 * regardless of what this layer does or forgets to check. The same is true
 * of the product-images/product-documents buckets below.
 */

/** Public — the site can read the catalogue without being anybody. */
export async function getProducts() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(
      'id, name, description, retail_price, installer_price, is_bulk_only, stock_quantity, image_url, datasheet_url, manual_url, specifications, category, voltage_class, rating, is_active, created_at',
    )
    .order('name', { ascending: true })

  if (error) return { error: error.message }
  return { data }
}

/**
 * The columns the shop needs. Deliberately not `*`: is_active is a stock-room
 * concern the storefront filters on rather than renders, and there is no
 * reason to ship the whole row to a browser to show a card.
 */
const STOREFRONT_COLUMNS =
  'id, name, description, retail_price, installer_price, is_bulk_only, stock_quantity, image_url, datasheet_url, manual_url, specifications, category, voltage_class, rating'

/**
 * Whether the person looking gets trade pricing.
 *
 * Asked here rather than in the page so /products and /products/[id] cannot
 * answer it differently, and so the rule stays next to the query that reads
 * the prices it applies to.
 */
async function readPricingContext(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { signedIn: false, isInstaller: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('customer_type, verification_status')
    .eq('id', user.id)
    .maybeSingle()

  return { signedIn: true, isInstaller: hasInstallerPricing(profile) }
}

/**
 * getStorefront()
 *
 * The catalogue as a customer sees it: active products only, in name order,
 * plus whether this visitor is being shown trade prices. Public — the shop
 * has to be browsable by someone who has not signed up yet, and the "Anyone
 * can view products" policy in supabase-orders-checkout.sql is what allows
 * that.
 *
 * A discontinued product is filtered out here rather than greyed out, and
 * createOrder() applies the same filter independently, so a stale
 * tab cannot order something that has since been pulled.
 */
export async function getStorefront() {
  const supabase = await createClient()

  const [{ data, error }, pricing] = await Promise.all([
    supabase.from('products').select(STOREFRONT_COLUMNS).eq('is_active', true).order('name', { ascending: true }),
    readPricingContext(supabase),
  ])

  if (error) return { error: error.message, ...pricing }
  return { data, ...pricing }
}

/**
 * getStorefrontProduct(id)
 *
 * One product's page. `data: null` with no error means the id is real but
 * the product is not on sale — the page turns that into a 404 rather than a
 * failure notice, because to a customer those are the same thing.
 */
export async function getStorefrontProduct(id) {
  const supabase = await createClient()

  const [{ data, error }, pricing] = await Promise.all([
    supabase.from('products').select(STOREFRONT_COLUMNS).eq('id', id).eq('is_active', true).maybeSingle(),
    readPricingContext(supabase),
  ])

  if (error) return { error: error.message, ...pricing }
  return { data, ...pricing }
}

function readProductFields(formData) {
  const name = String(formData.get('name') ?? '').trim()
  const retailPrice = Number(formData.get('retail_price'))

  if (!name) return { error: 'Name is required.' }
  if (!Number.isFinite(retailPrice) || retailPrice < 0) return { error: 'Enter a valid retail price.' }

  const installerPriceRaw = formData.get('installer_price')
  const installerPrice =
    installerPriceRaw === '' || installerPriceRaw == null ? null : Number(installerPriceRaw)
  if (installerPrice != null && (!Number.isFinite(installerPrice) || installerPrice < 0)) {
    return { error: 'Installer price must be a valid number, or left blank.' }
  }

  const stockQuantity = Number(formData.get('stock_quantity') ?? 0)
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    return { error: 'Stock must be a whole number, zero or more.' }
  }

  const description = String(formData.get('description') ?? '').trim()

  const specifications = formData
    .getAll('specifications')
    .map((s) => String(s).trim())
    .filter(Boolean)

  const categoryRaw = String(formData.get('category') ?? '').trim()
  if (categoryRaw && !['inverter', 'battery'].includes(categoryRaw)) {
    return { error: 'Type must be inverter or battery.' }
  }

  const voltageRaw = String(formData.get('voltage_class') ?? '').trim()
  if (voltageRaw && !['low', 'high'].includes(voltageRaw)) {
    return { error: 'Voltage must be low or high.' }
  }

  const ratingRaw = formData.get('rating')
  const rating = ratingRaw === '' || ratingRaw == null ? null : Number(ratingRaw)
  if (rating != null && (!Number.isFinite(rating) || rating < 0 || rating > 5)) {
    return { error: 'Rating must be between 0 and 5.' }
  }

  return {
    row: {
      name,
      description: description || null,
      retail_price: retailPrice,
      installer_price: installerPrice,
      stock_quantity: stockQuantity,
      specifications,
      category: categoryRaw || null,
      voltage_class: voltageRaw || null,
      rating,
    },
  }
}

/** File extension used for the storage path — from the upload's own name, not guessed from content. */
function extensionOf(file, fallback) {
  const ext = file?.name?.split('.').pop()
  return ext && ext.length <= 5 ? ext.toLowerCase() : fallback
}

async function uploadProductFile(supabase, bucket, productId, kind, file, fallbackExt) {
  if (!file || typeof file === 'string' || file.size === 0) return {}

  const path = `${productId}/${kind}_${Date.now()}.${extensionOf(file, fallbackExt)}`
  const { error } = await supabase.storage.from(bucket).upload(path, file)
  if (error) return { error: `${kind} upload failed: ${error.message}` }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return { url: data.publicUrl }
}

/**
 * Uploads whatever files are present in formData under image/datasheet/manual
 * and returns the columns to write. A field the admin left empty is just
 * absent from the result, so it never overwrites an existing file with null.
 */
async function uploadProductFiles(supabase, productId, formData) {
  const image = await uploadProductFile(supabase, IMAGE_BUCKET, productId, 'image', formData.get('image'), 'jpg')
  if (image.error) return { error: image.error }

  const datasheet = await uploadProductFile(
    supabase, DOCUMENT_BUCKET, productId, 'datasheet', formData.get('datasheet'), 'pdf',
  )
  if (datasheet.error) return { error: datasheet.error }

  const manual = await uploadProductFile(supabase, DOCUMENT_BUCKET, productId, 'manual', formData.get('manual'), 'pdf')
  if (manual.error) return { error: manual.error }

  const urls = {}
  if (image.url) urls.image_url = image.url
  if (datasheet.url) urls.datasheet_url = datasheet.url
  if (manual.url) urls.manual_url = manual.url
  return { urls }
}

/**
 * createProduct(formData)
 *
 * formData fields: name, description?, retail_price, installer_price?,
 * stock_quantity?, image? (File), datasheet? (File, PDF), manual? (File, PDF)
 *
 * The row is inserted first so uploaded files have a product id to file
 * under (product-images/<id>/..., product-documents/<id>/...), then the
 * resulting URLs are saved onto that same row.
 */
export async function createProduct(formData) {
  const { supabase, isAdmin } = await readAdminSession()
  if (!isAdmin) return { error: 'Not authorized' }

  const { row, error: validationError } = readProductFields(formData)
  if (validationError) return { error: validationError }

  const { data: product, error } = await supabase.from('products').insert(row).select('id').single()
  if (error) return { error: error.message }

  const { urls, error: uploadError } = await uploadProductFiles(supabase, product.id, formData)
  if (uploadError) return { error: `Product was created, but ${uploadError}` }

  if (Object.keys(urls).length) {
    const { error: urlError } = await supabase.from('products').update(urls).eq('id', product.id)
    if (urlError) return { error: `Product was created, but saving its files failed: ${urlError.message}` }
  }

  return { success: true, id: product.id }
}

/**
 * updateProduct(id, formData)
 *
 * Same fields as createProduct. A file field left empty keeps whatever the
 * product already has — this never clears an image/datasheet/manual, only
 * replaces it.
 */
export async function updateProduct(id, formData) {
  const { supabase, isAdmin } = await readAdminSession()
  if (!isAdmin) return { error: 'Not authorized' }

  const { row, error: validationError } = readProductFields(formData)
  if (validationError) return { error: validationError }

  const { urls, error: uploadError } = await uploadProductFiles(supabase, id, formData)
  if (uploadError) return { error: uploadError }

  const { error } = await supabase.from('products').update({ ...row, ...urls }).eq('id', id)
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
