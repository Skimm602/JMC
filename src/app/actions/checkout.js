'use server'

import { randomUUID } from 'node:crypto'
import { createClient } from '@/utils/supabase/server'
import { GATEWAY_PAYMENT_METHODS, isSupportedGatewayMethod, gatewayClient } from '@/utils/payments/gateway'

/**
 * Track A — Gateway checkout.
 *
 * Covers the three payment methods `orders.payment_method` allows: gcash,
 * qr_ph, pesonet. No PSP is wired in yet — gatewayClient is the stub in
 * src/utils/payments/gateway.js; everything else here (pricing, the order
 * row, the pending order_items) is real and does not change when a real
 * client replaces the stub.
 *
 * Requires supabase-orders-checkout.sql to have been run — orders,
 * order_items and products have RLS enabled with no policies otherwise, and
 * every write below is rejected until that script grants access.
 */

/**
 * createGatewayCheckout({ items, paymentMethod })
 *
 * items: [{ productId, quantity }, ...]  — cart contents, not prices. Prices
 *   are always re-read from `products` server-side; the client only gets to
 *   say what it wants and how many.
 * paymentMethod: 'gcash' | 'qr_ph' | 'pesonet'
 *
 * Returns:
 *   { success: true, orderId, checkoutUrl }
 *   { error: string }
 */
export async function createGatewayCheckout({ items, paymentMethod }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!isSupportedGatewayMethod(paymentMethod)) {
    return { error: `Payment method must be one of: ${GATEWAY_PAYMENT_METHODS.join(', ')}` }
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: 'Cart is empty' }
  }

  const quantityByProductId = new Map()
  for (const item of items) {
    const quantity = Number(item?.quantity)
    if (!item?.productId || !Number.isInteger(quantity) || quantity < 1) {
      return { error: 'Each cart item needs a productId and a quantity of at least 1' }
    }
    quantityByProductId.set(item.productId, (quantityByProductId.get(item.productId) ?? 0) + quantity)
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('customer_type')
    .eq('id', user.id)
    .maybeSingle()
  if (profileError) return { error: profileError.message }

  const productIds = [...quantityByProductId.keys()]
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, retail_price, installer_price, stock_quantity')
    .in('id', productIds)
  if (productsError) return { error: productsError.message }

  if (!products || products.length !== productIds.length) {
    return { error: 'One or more items in the cart are no longer available' }
  }

  const isInstaller = profile?.customer_type === 'installer'
  let total = 0
  const orderItems = []

  for (const product of products) {
    const quantity = quantityByProductId.get(product.id)

    if (product.stock_quantity != null && quantity > product.stock_quantity) {
      return { error: `Only ${product.stock_quantity} left in stock for one of the items in your cart` }
    }

    const unitPrice = isInstaller && product.installer_price != null
      ? Number(product.installer_price)
      : Number(product.retail_price)

    total += unitPrice * quantity
    orderItems.push({ product_id: product.id, quantity, price_at_purchase: unitPrice })
  }

  const orderId = randomUUID()

  let session
  try {
    session = await gatewayClient.createCheckoutSession({
      orderId,
      amount: total,
      method: paymentMethod,
      description: `Order ${orderId}`,
    })
  } catch (gatewayError) {
    return { error: `Could not start payment: ${gatewayError.message}` }
  }

  const { error: orderError } = await supabase.from('orders').insert({
    id: orderId,
    user_id: user.id,
    status: 'pending',
    payment_method: paymentMethod,
    payment_reference: session.reference,
    total,
  })
  if (orderError) return { error: orderError.message }

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems.map((item) => ({ ...item, order_id: orderId })))

  // The order row above already exists with a real gateway reference — surface
  // this rather than unwind it, the same way signUp() leaves a profile-insert
  // failure for investigation instead of deleting the auth user it just made.
  if (itemsError) {
    return { error: `Order ${orderId} was created but its items failed to save: ${itemsError.message}` }
  }

  return { success: true, orderId, checkoutUrl: session.checkoutUrl }
}
