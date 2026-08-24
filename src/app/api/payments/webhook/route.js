import { timingSafeEqual } from 'node:crypto'
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
 * Because that function's only other check is the payment reference, the
 * route is gated on a shared secret and is off unless one is configured:
 * with no PAYMENTS_WEBHOOK_SECRET set it answers 404, so a public
 * deployment exposes nothing until a provider is actually wired up.
 *
 * When a real PSP is connected, replace the shared-secret check with that
 * provider's own signed-callback verification (Xendit's `x-callback-token`,
 * Maya's checkout webhook secret, ...).
 */
export async function POST(request) {
  const secret = process.env.PAYMENTS_WEBHOOK_SECRET
  if (!secret) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
  if (!matchesSecret(request.headers.get('x-webhook-secret'), secret)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

/**
 * Constant-time header comparison, so a caller can't recover the secret one
 * byte at a time by timing the rejection.
 */
function matchesSecret(provided, expected) {
  if (!provided) return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
