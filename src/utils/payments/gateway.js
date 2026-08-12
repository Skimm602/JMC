/**
 * Track A — Gateway checkout client.
 *
 * No PSP has been picked yet. This module is the seam: `checkout.js` only
 * calls `gatewayClient.createCheckoutSession(...)`, so wiring a real
 * provider (Xendit's Payment Request API and Maya's Checkout API both cover
 * this same trio — e-wallet/GCash, QR Ph, and PesoNet direct debit) means
 * writing a client with this same shape and swapping the export at the
 * bottom, not touching the checkout action.
 */

/** Mirrors the `orders.payment_method` check constraint — keep in sync. */
export const GATEWAY_PAYMENT_METHODS = ['gcash', 'qr_ph', 'pesonet']

export function isSupportedGatewayMethod(method) {
  return GATEWAY_PAYMENT_METHODS.includes(method)
}

/**
 * createCheckoutSession({ orderId, amount, method, description })
 *
 * Returns { reference, checkoutUrl }.
 *
 *   reference    Ties a later webhook callback back to the order (see
 *                mark_order_paid() in supabase-orders-checkout.sql). A real
 *                client should still return one — whatever the PSP calls its
 *                own charge/payment-request id, mapped into this field.
 *   checkoutUrl  Where the customer is sent to actually pay.
 *
 * This stub does neither for real: it fabricates both so the rest of the
 * checkout flow (order creation, the pending-order record, the webhook
 * contract) can be built and tested before a provider is chosen.
 */
async function stubCreateCheckoutSession({ orderId, amount, method, description }) {
  if (!isSupportedGatewayMethod(method)) {
    throw new Error(`Unsupported payment method: ${method}`)
  }

  if (!orderId || !(amount > 0)) {
    throw new Error('createCheckoutSession requires an orderId and a positive amount')
  }

  // Real implementation: POST to the provider with { amount, currency: 'PHP',
  // channel: method, reference: orderId, description }, and return the
  // provider's hosted-checkout URL and its charge/session id as `reference`.
  const reference = `stub_${method}_${orderId}`
  const checkoutUrl = `/checkout/stub?ref=${encodeURIComponent(reference)}&amount=${amount}`

  return { reference, checkoutUrl }
}

export const gatewayClient = {
  createCheckoutSession: stubCreateCheckoutSession,
}
