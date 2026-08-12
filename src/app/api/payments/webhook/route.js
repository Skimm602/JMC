import { createClient } from '@/utils/supabase/server'

/**
 * Track A — gateway payment callback.
 *
 * Where a real PSP (Xendit, Maya, ...) POSTs when a gcash/qr_ph/pesonet
 * payment settles. There is no user session on a server-to-server callback,
 * so confirmation goes through mark_order_paid() — a SECURITY DEFINER
 * function granted to anon (see supabase-orders-checkout.sql) rather than
 * an authenticated update.
 *
 * NOT PRODUCTION-SAFE YET: this trusts the request body as-is. Before
 * pointing a real provider at this route, verify its signed callback header
 * (Xendit's `x-callback-token`, Maya's checkout webhook secret, etc.) here,
 * before calling mark_order_paid — matching the reference-based guard
 * that function currently uses as its only check.
 */
export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { orderId, reference } = body ?? {}
  if (!orderId || !reference) {
    return Response.json({ error: 'orderId and reference are required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: marked, error } = await supabase.rpc('mark_order_paid', {
    p_order_id: orderId,
    p_payment_reference: reference,
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!marked) return Response.json({ error: 'No matching pending order for that reference' }, { status: 404 })

  return Response.json({ success: true })
}
