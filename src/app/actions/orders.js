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
      'id, user_id, status, payment_method, payment_reference, total, created_at, paid_at, order_items(id, quantity, price_at_purchase, products(id, name, image_url))',
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
