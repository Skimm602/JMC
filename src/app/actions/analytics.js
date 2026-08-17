'use server'

import { readAdminSession } from '@/utils/admin-session'
import { getOrders } from '@/app/actions/orders'
import { getProducts } from '@/app/actions/catalogue'
import { computeOverview } from '@/utils/analytics'

/**
 * getAnalyticsOverview()
 *
 * The analytics tab reuses the same reads Orders and Maintenance already
 * do — getOrders() and getProducts() — rather than a bespoke query, so the
 * numbers here can never disagree with what those two pages show.
 */
export async function getAnalyticsOverview() {
  const { isAdmin } = await readAdminSession()
  if (!isAdmin) return { error: 'Not authorized' }

  const [orders, products] = await Promise.all([getOrders(), getProducts()])

  if (orders.error) return { error: orders.error }
  if (products.error) return { error: products.error }

  return { data: computeOverview(orders.data ?? [], products.data ?? []) }
}
