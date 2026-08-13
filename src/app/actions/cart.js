'use server'

import { createClient } from '@/utils/supabase/server'
import { hasInstallerPricing, quote } from '@/utils/pricing'

/**
 * The cart: what a signed-in customer has added, kept in the database rather
 * than the browser so it survives a refresh, a logout, or a different
 * device. One row per (customer, product) — cart_items' unique constraint
 * (supabase-cart.sql) makes every write below an upsert rather than a second
 * row for something already in the cart.
 *
 * Every write re-reads the product it touches rather than trusting a stale
 * price or stock figure a caller might be holding, the same discipline
 * createGatewayCheckout() uses. RLS restricts every row to its own owner;
 * the .eq('user_id', ...) filters here are belt-and-braces, not the actual
 * guard.
 */

async function currentUser(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * getCart()
 *
 * Returns { data: { items, unavailable, subtotal, discount, vat, total }, isInstaller }.
 * items are priced through the same quote() checkout uses, so a cart page
 * shows the total it will actually be charged rather than a guess at one.
 *
 * A product pulled from the catalogue since it was added stays as a row
 * (removing it here would be a silent edit to someone's cart) but cannot be
 * priced, so its cart_item id comes back in `unavailable` instead of `items`
 * — the page can flag it and offer to remove it.
 *
 * A guest gets an empty cart rather than an error: there is nothing to load.
 */
export async function getCart() {
  const supabase = await createClient()
  const user = await currentUser(supabase)
  if (!user) return { data: { items: [], unavailable: [], subtotal: 0, discount: 0, vat: 0, total: 0 }, isInstaller: false }

  const [{ data: rows, error }, { data: profile }] = await Promise.all([
    supabase
      .from('cart_items')
      .select(
        'id, quantity, product:products(id, name, retail_price, installer_price, stock_quantity, image_url, is_active)',
      )
      .order('created_at', { ascending: true }),
    supabase.from('profiles').select('customer_type').eq('id', user.id).maybeSingle(),
  ])
  if (error) return { error: error.message }

  const isInstaller = hasInstallerPricing(profile)

  const priceable = (rows ?? []).filter((r) => r.product?.is_active)
  const unavailable = (rows ?? [])
    .filter((r) => !r.product?.is_active)
    .map((r) => ({ cartItemId: r.id, productId: r.product?.id, name: r.product?.name ?? 'A product' }))

  const priced = quote({
    lines: priceable.map((r) => ({ product: r.product, quantity: r.quantity })),
    isInstaller,
  })

  const items = priced.items.map((item, i) => ({ cartItemId: priceable[i].id, ...item }))

  return {
    data: {
      items,
      unavailable,
      subtotal: priced.subtotal,
      discount: priced.discount,
      vat: priced.vat,
      total: priced.total,
    },
    isInstaller,
  }
}

/** The product a cart write is about to touch — active only, with its stock. */
async function activeProduct(supabase, productId) {
  const { data, error } = await supabase
    .from('products')
    .select('id, stock_quantity')
    .eq('id', productId)
    .eq('is_active', true)
    .maybeSingle()
  if (error) return { error: error.message }
  if (!data) return { error: 'This product is not available.' }
  return { product: data }
}

const capToStock = (quantity, product) =>
  product.stock_quantity != null ? Math.min(quantity, product.stock_quantity) : quantity

/**
 * addToCart(productId, quantity = 1)
 *
 * Adds to whatever is already in the cart for this product rather than
 * replacing it — pressing "add to cart" twice means two more, not "two".
 * Clamped to stock, the same way maintenance's stock count is: never higher
 * than the shelf actually holds.
 */
export async function addToCart(productId, quantity = 1) {
  const supabase = await createClient()
  const user = await currentUser(supabase)
  if (!user) return { error: 'Log in to add to your cart.' }

  const add = Number(quantity)
  if (!Number.isInteger(add) || add < 1) return { error: 'Quantity must be a whole number of at least 1.' }

  const { product, error: productError } = await activeProduct(supabase, productId)
  if (productError) return { error: productError }

  const { data: existing, error: existingError } = await supabase
    .from('cart_items')
    .select('quantity')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle()
  if (existingError) return { error: existingError.message }

  const next = capToStock((existing?.quantity ?? 0) + add, product)
  if (next < 1) return { error: 'Out of stock.' }

  const { error } = await supabase
    .from('cart_items')
    .upsert(
      { user_id: user.id, product_id: productId, quantity: next, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,product_id' },
    )
  if (error) return { error: error.message }

  return { success: true, quantity: next }
}

/**
 * updateCartItem(productId, quantity)
 *
 * Sets the line to exactly this quantity — what a cart page's own quantity
 * field calls on change, as opposed to addToCart()'s "one more". Zero or
 * below removes the line rather than leaving a row nothing can point at.
 */
export async function updateCartItem(productId, quantity) {
  const supabase = await createClient()
  const user = await currentUser(supabase)
  if (!user) return { error: 'Log in to change your cart.' }

  const value = Number(quantity)
  if (!Number.isInteger(value)) return { error: 'Quantity must be a whole number.' }

  if (value <= 0) {
    const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id).eq('product_id', productId)
    if (error) return { error: error.message }
    return { success: true, quantity: 0 }
  }

  const { product, error: productError } = await activeProduct(supabase, productId)
  if (productError) return { error: productError }

  const capped = capToStock(value, product)

  const { error } = await supabase
    .from('cart_items')
    .upsert(
      { user_id: user.id, product_id: productId, quantity: capped, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,product_id' },
    )
  if (error) return { error: error.message }

  return { success: true, quantity: capped }
}

/** removeFromCart(productId) — one line off the cart. */
export async function removeFromCart(productId) {
  const supabase = await createClient()
  const user = await currentUser(supabase)
  if (!user) return { error: 'Log in to change your cart.' }

  const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id).eq('product_id', productId)
  if (error) return { error: error.message }
  return { success: true }
}

/** clearCart() — everything off the cart, e.g. once its order has been placed. */
export async function clearCart() {
  const supabase = await createClient()
  const user = await currentUser(supabase)
  if (!user) return { error: 'Log in to change your cart.' }

  const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id)
  if (error) return { error: error.message }
  return { success: true }
}
