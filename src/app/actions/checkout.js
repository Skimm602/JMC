'use server'

import { randomUUID } from 'node:crypto'
import { createClient } from '@/utils/supabase/server'
import { GATEWAY_PAYMENT_METHODS, isSupportedGatewayMethod, gatewayClient } from '@/utils/payments/gateway'
import { hasInstallerPricing, isPriced, quote } from '@/utils/pricing'

/**
 * The delivery address, checked before anything is written.
 *
 * All four parts are required on a new order: a courier cannot deliver to a
 * city alone, and an order that reaches the warehouse without a province is a
 * phone call rather than a shipment. The ZIP test is deliberately narrow —
 * every Philippine postal code is exactly four digits — because a typo caught
 * here costs a form field and a typo caught later costs a delivery.
 */
function readShippingAddress(shipping) {
  const streetAddress = String(shipping?.streetAddress ?? '').trim()
  const city = String(shipping?.city ?? '').trim()
  const province = String(shipping?.province ?? '').trim()
  const postalCode = String(shipping?.postalCode ?? '').trim()

  if (!streetAddress) return { error: 'Enter the street address this order ships to.' }
  if (!city) return { error: 'Enter the city or municipality.' }
  if (!province) return { error: 'Enter the province.' }
  if (!/^\d{4}$/.test(postalCode)) return { error: 'A Philippine ZIP code is four digits.' }

  return {
    row: {
      street_address: streetAddress,
      city,
      province,
      postal_code: postalCode,
    },
  }
}

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
 * createGatewayCheckout({ items, paymentMethod, shipping, acceptedTerms })
 *
 * items: [{ productId, quantity }, ...]  — cart contents, not prices. Prices
 *   are always re-read from `products` server-side; the client only gets to
 *   say what it wants and how many.
 * paymentMethod: 'gcash' | 'qr_ph' | 'pesonet'
 * shipping: { streetAddress, city, province, postalCode }
 * acceptedTerms: must be exactly true — the customer ticking "I agree to pay,
 *   and I understand this is not refundable". The summary they read it under
 *   is computed by the same pricing module used below, so what they agreed to
 *   and what gets charged are the same figure reached twice.
 *
 * Returns:
 *   { success: true, orderId, checkoutUrl, total }
 *   { error: string }
 */
export async function createGatewayCheckout({ items, paymentMethod, shipping, acceptedTerms }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!isSupportedGatewayMethod(paymentMethod)) {
    return { error: `Payment method must be one of: ${GATEWAY_PAYMENT_METHODS.join(', ')}` }
  }

  // `!== true` rather than falsy: this is the record that the customer
  // undertook to pay for something that will not be refunded, so it is worth
  // refusing anything that merely looks agreeable.
  if (acceptedTerms !== true) {
    return { error: 'Tick the box confirming you agree to pay and accept the no-refund policy.' }
  }

  const { row: shippingRow, error: shippingError } = readShippingAddress(shipping)
  if (shippingError) return { error: shippingError }

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
  // is_active is filtered in the query rather than checked after it, so a
  // product pulled from the catalogue since the page was opened falls out of
  // the count below and is reported as unavailable — which is what it is.
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, retail_price, installer_price, stock_quantity')
    .in('id', productIds)
    .eq('is_active', true)
  if (productsError) return { error: productsError.message }

  if (!products || products.length !== productIds.length) {
    return { error: 'One or more items in the cart are no longer available' }
  }

  const lines = []
  for (const product of products) {
    const quantity = quantityByProductId.get(product.id)

    // A product in the catalogue that has not been priced yet. The storefront
    // already refuses to offer these, so reaching here means a stale tab or a
    // hand-made request — and writing the order anyway would bill somebody
    // zero pesos for hardware.
    if (!isPriced(product)) {
      return { error: `${product.name} is not priced yet. Ask us for a quote before ordering it.` }
    }

    if (product.stock_quantity != null && quantity > product.stock_quantity) {
      return { error: `Only ${product.stock_quantity} left in stock for ${product.name}.` }
    }

    lines.push({ product, quantity })
  }

  // The same call the product page made to draw the summary, run again here
  // against prices the browser never had a chance to alter.
  const priced = quote({ lines, isInstaller: hasInstallerPricing(profile) })

  const orderItems = priced.items.map((item) => ({
    product_id: item.product.id,
    quantity: item.quantity,
    price_at_purchase: item.unitPrice,
  }))

  const orderId = randomUUID()

  let session
  try {
    session = await gatewayClient.createCheckoutSession({
      orderId,
      // The gateway collects the total including VAT — the subtotal is what
      // the sale was worth, not what the customer hands over.
      amount: priced.total,
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
    ...shippingRow,
    subtotal: priced.subtotal,
    discount: priced.discount,
    vat: priced.vat,
    total: priced.total,
    // Stamped on the server, never sent up from the page: this is the record
    // that the no-refund terms were accepted, so it must not be forgeable.
    terms_accepted_at: new Date().toISOString(),
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

  return { success: true, orderId, checkoutUrl: session.checkoutUrl, total: priced.total }
}
