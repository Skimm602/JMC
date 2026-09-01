'use server'

import { randomUUID } from 'node:crypto'
import { createClient } from '@/utils/supabase/server'
import { hasInstallerPricing, quote } from '@/utils/pricing'

/**
 * Placing an order, and attaching the payment afterwards.
 *
 * There is no payment gateway here and no card form. Checkout itself is open:
 * a customer orders the ordinary way and the order lands as `pending`. What
 * happens next is a phone call — somebody from VIP confirms sizing, install
 * and delivery, and an admin then approves it. Only once it is `approved` is
 * the customer asked to pay and attach proof of it, which is what
 * attachPaymentProof() below is for.
 *
 * Payment happens outside the site, however the two of them agreed on the
 * call: bank transfer, GCash, cash on collection. That is why
 * `payment_method` is not set — the proof shows what was used, and a dropdown
 * guessing at it would only be a second answer to disagree with.
 *
 * Requires supabase-orders-checkout.sql and supabase-order-approval.sql to
 * have been run.
 */

const PROOF_BUCKET = 'payment-proofs'
const DELIVERY_BUCKET = 'delivery-proofs'
const VAT_PROOF_BUCKET = 'vat-exemption-proofs'

/** Generous relative to what these actually are — a phone screenshot rarely
    exceeds a few MB — but set high enough that a large photo or a scanned
    PDF is never the reason a genuine proof gets rejected. */
const MAX_PROOF_BYTES = 50 * 1024 * 1024

/** What a bank app or camera actually produces. A PDF is included because
    some banks email a receipt rather than showing one. */
const PROOF_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'])

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

/** Extension from the upload's own name rather than guessed from its type,
    so a .jpeg stays a .jpeg and the admin's browser opens it as one. */
function extensionOf(file) {
  const ext = file?.name?.split('.').pop()
  return ext && ext.length <= 5 ? ext.toLowerCase() : 'jpg'
}

/**
 * createOrder(formData)
 *
 * formData fields:
 *   items          JSON [{ productId, quantity }] — what they want and how
 *                  many, never prices. Prices are re-read from `products`
 *                  server-side; the browser only says what it wants.
 *   shipping       JSON { streetAddress, city, province, postalCode }
 *   phone          the number to ring for the confirmation call
 *   note           optional — roof, existing system, when they can take a call
 *   acceptedTerms  'true' — the customer ticking "I agree to pay, and I
 *                  understand this is not refundable". The summary they read
 *                  it under is computed by the same pricing module used here,
 *                  so what they agreed to and what is recorded are the same
 *                  figure reached twice.
 *
 * No payment is taken here and none is asked for. The order lands as
 * `pending`, an admin calls to confirm it, and the money comes after that.
 *
 * Returns { success: true, orderId, total } or { error: string }.
 */
export async function createOrder(formData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Log in to place an order.' }

  let items
  let shipping
  try {
    items = JSON.parse(String(formData.get('items') ?? '[]'))
    shipping = JSON.parse(String(formData.get('shipping') ?? '{}'))
  } catch {
    return { error: 'Something went wrong. Try again.' }
  }

  if (String(formData.get('acceptedTerms')) !== 'true') {
    return { error: 'Tick the box to confirm the amount and the no-refund terms.' }
  }

  const { row: shippingRow, error: shippingError } = readShippingAddress(shipping)
  if (shippingError) return { error: shippingError }

  // The whole flow turns on somebody being able to ring this customer, so an
  // order without a number is not one the back office can act on.
  const phone = String(formData.get('phone') ?? '').trim().slice(0, 40)
  if (!phone) return { error: 'Leave a number we can call to confirm the order.' }

  const note = String(formData.get('note') ?? '').trim().slice(0, 1000)

  const quantityByProductId = new Map()
  for (const item of items ?? []) {
    const quantity = Number(item?.quantity)
    if (!item?.productId || !Number.isInteger(quantity) || quantity < 1) {
      return { error: 'Something went wrong. Try again.' }
    }
    quantityByProductId.set(item.productId, (quantityByProductId.get(item.productId) ?? 0) + quantity)
  }
  if (quantityByProductId.size === 0) return { error: 'There is nothing to order.' }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('customer_type, verification_status')
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
    return { error: 'One or more items are no longer available.' }
  }

  const lines = []
  for (const product of products) {
    const quantity = quantityByProductId.get(product.id)

    // A product with no price yet is allowed through. It has to be: the
    // confirmation call is where the figure is agreed, and refusing the order
    // would mean refusing the conversation that sets the price. The order
    // carries a zero total until an admin enters the agreed figure, and the
    // customer is never shown that zero as a price — see `quoted` in
    // ProductCheckout. Nothing can be paid or approved on a zero.

    if (product.stock_quantity != null && quantity > product.stock_quantity) {
      return { error: `Only ${product.stock_quantity} left in stock for ${product.name}.` }
    }

    lines.push({ product, quantity })
  }

  // The same call the product page made to draw the summary, run again here
  // against prices the browser never had a chance to alter.
  const priced = quote({ lines, isInstaller: hasInstallerPricing(profile) })

  const orderId = randomUUID()

  const { error: orderError } = await supabase.from('orders').insert({
    id: orderId,
    user_id: user.id,
    // Pending until somebody has called to confirm it. Nothing here approves
    // itself, and no money is asked for until it has been.
    status: 'pending',
    ...shippingRow,
    contact_phone: phone,
    customer_note: note || null,
    subtotal: priced.subtotal,
    discount: priced.discount,
    vat: priced.vat,
    total: priced.total,
    // Stamped on the server, never sent up from the page: this is the record
    // that the no-refund terms were accepted, so it must not be forgeable.
    terms_accepted_at: new Date().toISOString(),
  })
  if (orderError) return { error: orderError.message }

  const { error: itemsError } = await supabase.from('order_items').insert(
    priced.items.map((item) => ({
      order_id: orderId,
      product_id: item.product.id,
      quantity: item.quantity,
      price_at_purchase: item.unitPrice,
    })),
  )

  // The order row above already exists — surface this rather than unwind it,
  // the same way signUp() leaves a profile-insert failure for investigation
  // instead of deleting the auth user it just made.
  if (itemsError) {
    return { error: `Order ${orderId} was created but its items failed to save: ${itemsError.message}` }
  }

  return { success: true, orderId, total: priced.total }
}

/**
 * attachPaymentProof(formData)
 *
 * formData fields: orderId, proof (File).
 *
 * The step after the confirmation call. An admin has approved the order, the
 * customer has paid however the two of them agreed, and this records what
 * that looked like. It does not mark anything paid — an admin reads the proof
 * and moves the order themselves, because "customer says they paid" and "the
 * money arrived" are different facts and only one of them belongs to the
 * customer.
 *
 * The status stays `approved` throughout. The presence of a proof is what the
 * back office sorts on, and the RLS policy in supabase-order-approval.sql
 * refuses this write on an order in any other state regardless of what
 * reaches here.
 */
export async function attachPaymentProof(formData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Log in to attach a payment.' }

  const orderId = String(formData.get('orderId') ?? '')
  if (!orderId) return { error: 'Something went wrong. Try again.' }

  const proof = formData.get('proof')
  if (!proof || typeof proof === 'string' || proof.size === 0) {
    return { error: 'Attach a photo or screenshot of the payment.' }
  }
  if (proof.size > MAX_PROOF_BYTES)
    return { error: `That file is over ${MAX_PROOF_BYTES / (1024 * 1024)} MB. A screenshot or photo is enough.` }
  if (proof.type && !PROOF_TYPES.has(proof.type)) return { error: 'Attach an image or a PDF.' }

  // Read the order first so the refusal can say which of the two reasons it
  // is — not yours, or not ready — rather than a policy violation.
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status, payment_proof_path')
    .eq('id', orderId)
    .maybeSingle()

  if (orderError) return { error: orderError.message }
  if (!order) return { error: 'That order could not be found.' }

  if (order.status === 'pending') {
    return { error: 'This order is still waiting for our confirmation call. We will ask for payment after it.' }
  }
  if (order.status !== 'approved') {
    return { error: 'This order is past the point where a payment can be attached. Use Customer support.' }
  }

  // Filed under the customer's own uuid, which is what the bucket policy keys
  // on — a path outside their own folder is refused by storage rather than by
  // this code. Timestamped so re-uploading a clearer photo does not have to
  // overwrite the first one.
  const proofPath = `${user.id}/${orderId}_${Date.now()}.${extensionOf(proof)}`

  const { error: uploadError } = await supabase.storage.from(PROOF_BUCKET).upload(proofPath, proof, {
    contentType: proof.type || undefined,
    upsert: false,
  })
  if (uploadError) return { error: `Could not upload that: ${uploadError.message}` }

  const { error: updateError } = await supabase
    .from('orders')
    .update({ payment_proof_path: proofPath, payment_proof_uploaded_at: new Date().toISOString() })
    .eq('id', orderId)

  if (updateError) {
    // The file is in the bucket and now belongs to no order. Remove it rather
    // than leave an orphan nobody will ever look at.
    await supabase.storage.from(PROOF_BUCKET).remove([proofPath])
    return { error: updateError.message }
  }

  return { success: true }
}

/**
 * attachVatExemptionProof(formData)
 *
 * formData fields: orderId, proof (File).
 *
 * Optional, and only while an order is still `pending` — a senior citizen,
 * PWD or other documented exemption raised on the confirmation call. This
 * only attaches the photo or scan; it does not remove VAT itself. An admin
 * reviews it and decides, the same way a payment proof does not mark an
 * order paid on its own — see admin_set_order_vat_exempt() and
 * VatExemptEditor in admin/OrdersBoard.jsx.
 */
export async function attachVatExemptionProof(formData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Log in to attach a document.' }

  const orderId = String(formData.get('orderId') ?? '')
  if (!orderId) return { error: 'Something went wrong. Try again.' }

  const proof = formData.get('proof')
  if (!proof || typeof proof === 'string' || proof.size === 0) {
    return { error: 'Attach a photo or scan of the ID or certificate.' }
  }
  if (proof.size > MAX_PROOF_BYTES)
    return { error: `That file is over ${MAX_PROOF_BYTES / (1024 * 1024)} MB. A photo or scan is enough.` }
  if (proof.type && !PROOF_TYPES.has(proof.type)) return { error: 'Attach an image or a PDF.' }

  const proofPath = `${user.id}/${orderId}_${Date.now()}.${extensionOf(proof)}`

  const { error: uploadError } = await supabase.storage.from(VAT_PROOF_BUCKET).upload(proofPath, proof, {
    contentType: proof.type || undefined,
    upsert: false,
  })
  if (uploadError) return { error: `Could not upload that: ${uploadError.message}` }

  const { data: attached, error } = await supabase.rpc('attach_vat_exemption_proof', {
    p_order_id: orderId,
    p_proof_path: proofPath,
  })

  if (error || !attached) {
    await supabase.storage.from(VAT_PROOF_BUCKET).remove([proofPath])
    return { error: error?.message ?? 'That order could not be updated.' }
  }

  return { success: true }
}

/**
 * confirmDelivery(formData)
 *
 * formData fields: orderId, proof (File).
 *
 * The last step, and the only one the customer takes on their own: the box
 * arrived, here is a photograph of it, the order is done. Nobody in the back
 * office can know this first-hand, which is why it is theirs to press.
 *
 * Single-use by construction rather than by a flag — confirm_delivery() only
 * moves an order that is still `shipped`, so the second press finds nothing
 * to move. The upload happens first so a failed write never leaves an order
 * completed with no photograph against it.
 */
export async function confirmDelivery(formData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Log in to confirm delivery.' }

  const orderId = String(formData.get('orderId') ?? '')
  if (!orderId) return { error: 'Something went wrong. Try again.' }

  const proof = formData.get('proof')
  if (!proof || typeof proof === 'string' || proof.size === 0) {
    return { error: 'Attach a photo of what arrived.' }
  }
  if (proof.size > MAX_PROOF_BYTES) return { error: `That file is over ${MAX_PROOF_BYTES / (1024 * 1024)} MB. A photo is enough.` }
  if (proof.type && !PROOF_TYPES.has(proof.type)) return { error: 'Attach an image or a PDF.' }

  const proofPath = `${user.id}/${orderId}_${Date.now()}.${extensionOf(proof)}`

  const { error: uploadError } = await supabase.storage.from(DELIVERY_BUCKET).upload(proofPath, proof, {
    contentType: proof.type || undefined,
    upsert: false,
  })
  if (uploadError) return { error: `Could not upload that: ${uploadError.message}` }

  const { data: moved, error } = await supabase.rpc('confirm_delivery', {
    p_order_id: orderId,
    p_proof_path: proofPath,
  })

  if (error || !moved) {
    // The photo is in the bucket and belongs to no completed order. Remove it
    // rather than leave an orphan nobody will look at.
    await supabase.storage.from(DELIVERY_BUCKET).remove([proofPath])
    return { error: error?.message ?? 'That order could not be marked as received.' }
  }

  return { success: true }
}

/**
 * getDeliveryProofUrl(orderId)
 *
 * The same five-minute signature as the payment proof, for the back office to
 * see what actually turned up on the doorstep.
 */
export async function getDeliveryProofUrl(orderId) {
  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select('delivery_proof_path')
    .eq('id', orderId)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!order?.delivery_proof_path) return { error: 'That order has no delivery photo attached.' }

  const { data, error: signError } = await supabase.storage
    .from(DELIVERY_BUCKET)
    .createSignedUrl(order.delivery_proof_path, 60 * 5)

  if (signError) return { error: signError.message }
  return { data: data.signedUrl }
}

/**
 * getPaymentProofUrl(orderId)
 *
 * A short-lived link to one order's payment proof, for the back office to
 * read before confirming payment. Five minutes, the same as verification
 * documents: long enough to open, short enough that a copied URL in a chat
 * log is not a standing key to somebody's bank screenshot.
 *
 * The bucket's own policies decide who gets a signature, so a customer asking
 * for another customer's proof gets nothing regardless of what reaches here.
 */
export async function getPaymentProofUrl(orderId) {
  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select('payment_proof_path')
    .eq('id', orderId)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!order?.payment_proof_path) return { error: 'That order has no payment proof attached.' }

  const { data, error: signError } = await supabase.storage
    .from(PROOF_BUCKET)
    .createSignedUrl(order.payment_proof_path, 60 * 5)

  if (signError) return { error: signError.message }
  return { data: data.signedUrl }
}
