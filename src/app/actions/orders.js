'use server'

import { createClient } from '@/utils/supabase/server'
import { readAdminSession } from '@/utils/admin-session'

/**
 * Orders, from the admin's side.
 *
 * These are the same rows Track A's gateway checkout creates (see
 * src/app/actions/checkout.js) — a customer pays via GCash/QR Ph/PesoNet,
 * the gateway webhook marks the row 'paid', and everything from there
 * (processing/shipped/completed, or cancelling) is the admin's call.
 *
 * Status only ever changes through admin_set_order_status() — never a bare
 * UPDATE — because it also has to move stock off the shelf exactly once, the
 * moment fulfilment starts. See supabase-admin-orders-products.sql.
 */

export async function getOrders() {
  const { supabase, isAdmin } = await readAdminSession()
  if (!isAdmin) return { error: 'Not authorized' }

  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      'id, user_id, status, payment_method, payment_reference, total, created_at, paid_at, approved_at, ' +
        'payment_proof_path, payment_proof_uploaded_at, contact_phone, customer_note, ' +
        'street_address, city, province, postal_code, courier, tracking_number, admin_notes, ' +
        'order_items(id, quantity, price_at_purchase, products(id, name, image_url))',
    )
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  if (!orders?.length) return { data: [] }

  // orders.user_id has no FK straight to profiles (only to auth.users, which
  // profiles also keys off), so PostgREST can't embed it automatically — a
  // second query for the distinct customers involved is simpler than adding
  // a redundant foreign key just to unlock that embed.
  const userIds = [...new Set(orders.map((o) => o.user_id).filter(Boolean))]
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone')
    .in('id', userIds)

  if (profilesError) return { error: profilesError.message }

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))
  return { data: orders.map((o) => ({ ...o, customer: profileById.get(o.user_id) ?? null })) }
}

/**
 * setOrderStatus(orderId, status)
 *
 * status: 'processing' | 'shipped' | 'completed' | 'cancelled'
 *
 * The database is the one that knows which moves are legal from where —
 * this just passes its answer through, error message and all, since it is
 * always more specific than anything this layer could invent.
 */
export async function setOrderStatus(orderId, status) {
  const supabase = await createClient()

  const { data: changed, error } = await supabase.rpc('admin_set_order_status', {
    p_order_id: orderId,
    p_status: status,
  })

  if (error) return { error: error.message }
  if (!changed) return { error: 'That order could not be updated.' }

  return { success: true }
}

/**
 * updateOrderAddress(orderId, { streetAddress, city, province, postalCode })
 *
 * Fixing a typo caught after the order was placed. Same four fields
 * checkout itself requires, checked the same way — the database rejects an
 * edit that would leave the order with an address the warehouse cannot act
 * on, same as it would a customer's.
 */
export async function updateOrderAddress(orderId, address) {
  const supabase = await createClient()

  const { data: changed, error } = await supabase.rpc('admin_update_order_address', {
    p_order_id: orderId,
    p_street_address: address?.streetAddress ?? '',
    p_city: address?.city ?? '',
    p_province: address?.province ?? '',
    p_postal_code: address?.postalCode ?? '',
  })

  if (error) return { error: error.message }
  if (!changed) return { error: 'That order could not be updated.' }

  return { success: true }
}

/**
 * updateOrderTracking(orderId, { courier, trackingNumber })
 *
 * Independent of marking an order shipped — a courier and a tracking number
 * are often known before that press, not after, and there is no reason to
 * force them into the same action.
 */
export async function updateOrderTracking(orderId, { courier, trackingNumber }) {
  const supabase = await createClient()

  const { data: changed, error } = await supabase.rpc('admin_update_order_tracking', {
    p_order_id: orderId,
    p_courier: courier ?? '',
    p_tracking_number: trackingNumber ?? '',
  })

  if (error) return { error: error.message }
  if (!changed) return { error: 'That order could not be updated.' }

  return { success: true }
}

/**
 * updateOrderNotes(orderId, notes)
 *
 * Internal only — getMyOrders() never selects admin_notes, so nothing
 * written here reaches the customer the order belongs to.
 */
export async function updateOrderNotes(orderId, notes) {
  const supabase = await createClient()

  const { data: changed, error } = await supabase.rpc('admin_update_order_notes', {
    p_order_id: orderId,
    p_notes: notes ?? '',
  })

  if (error) return { error: error.message }
  if (!changed) return { error: 'That order could not be updated.' }

  return { success: true }
}

/**
 * setOrderTotal(orderId, subtotal)
 *
 * The price agreed on the confirmation call, for an order placed against a
 * product that had none. VAT is added by the database rather than sent from
 * here — the arithmetic belongs on one side of the wire, and every other
 * total on this site is reached the same way.
 *
 * Only while the order is still pending: once it is approved the customer has
 * been told a figure, and it must not move under them.
 */
export async function setOrderTotal(orderId, subtotal) {
  const supabase = await createClient()

  const value = Number(subtotal)
  if (!Number.isFinite(value) || value <= 0) return { error: 'Enter a price greater than zero.' }

  const { data: changed, error } = await supabase.rpc('admin_set_order_total', {
    p_order_id: orderId,
    p_subtotal: value,
  })

  if (error) return { error: error.message }
  if (!changed) return { error: 'That order could not be updated.' }

  return { success: true }
}
