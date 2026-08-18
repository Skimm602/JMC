'use server'

import { createClient } from '@/utils/supabase/server'

/**
 * What a customer can see of their own orders.
 *
 * The "Customers view their own orders" policy already restricts this to
 * user_id = auth.uid(), so the filter below is belt to the database's braces
 * rather than the thing doing the work.
 */
export async function getMyOrders() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, status, payment_method, payment_reference, total, created_at, paid_at, approved_at, payment_proof_uploaded_at, order_items(id, quantity, price_at_purchase, products(id, name, image_url))',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}
