'use server'

import { createClient } from '@/utils/supabase/server'
import { readAdminSession } from '@/utils/admin-session'

/**
 * Orders, from the reviewer's side.
 *
 * Nothing on the public site places one yet — these rows are entered directly
 * for now — so everything here is admin-only and the RLS policies say the same
 * thing independently.
 *
 * Approving and rejecting are database functions rather than updates, because
 * approving is two writes that must not come apart: the status changes and the
 * stock comes off the shelf in the same transaction. An approved order the
 * warehouse cannot fill is worse than a refused one.
 */

export async function getOrders() {
  const { supabase, isAdmin } = await readAdminSession()
  if (!isAdmin) return { error: 'Not authorized' }

  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, reference, customer_name, customer_email, customer_phone, notes, status, rejection_reason, placed_at, reviewed_at, order_items(id, model, description, quantity, unit_price)',
    )
    .order('placed_at', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}

/**
 * approveOrder(orderId)
 *
 * The database refuses if any line is short, and says which one — that message
 * is more useful than anything this layer could invent, so it is passed
 * through rather than replaced with something tidy.
 */
export async function approveOrder(orderId) {
  const supabase = await createClient()

  const { data: approved, error } = await supabase.rpc('approve_order', { p_order: orderId })

  if (error) return { error: error.message }
  if (!approved) return { error: 'That order could not be approved.' }

  return { success: true }
}

export async function rejectOrder(orderId, reason) {
  const supabase = await createClient()

  if (!String(reason ?? '').trim()) {
    return { error: 'Say why. The customer is told this, and "rejected" on its own is not something anyone can act on.' }
  }

  const { data: rejected, error } = await supabase.rpc('reject_order', {
    p_order: orderId,
    p_reason: String(reason).trim(),
  })

  if (error) return { error: error.message }
  if (!rejected) return { error: 'That order could not be rejected.' }

  return { success: true }
}
