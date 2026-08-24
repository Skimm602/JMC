'use server'

import { readAdminSession } from '@/utils/admin-session'
import { getOrders } from '@/app/actions/orders'
import { getProducts } from '@/app/actions/catalogue'
import { computeOverview, computeTraffic } from '@/utils/analytics'

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

/**
 * Postgres for "that function does not exist" and "that table does not
 * exist". Both mean supabase-page-views.sql has not been run yet, which is a
 * setup step rather than a fault — see getTrafficOverview below.
 */
const NOT_INSTALLED = ['42883', '42P01']

/**
 * getTrafficOverview()
 *
 * Visitor counts for the analytics tab. Read through its own call rather than
 * folded into getAnalyticsOverview(), because traffic and sales fail
 * independently: the counter is an optional install, and a site that has not
 * added it yet should still see its revenue.
 *
 * A missing table comes back as `notInstalled` instead of an error, so the
 * tab can say what to run rather than showing an admin a Postgres code.
 */
export async function getTrafficOverview() {
  const { supabase, isAdmin } = await readAdminSession()
  if (!isAdmin) return { error: 'Not authorized' }

  const { data, error } = await supabase.rpc('admin_page_view_daily', { p_days: 365 })

  if (error) {
    if (NOT_INSTALLED.includes(error.code)) return { notInstalled: true }
    return { error: error.message }
  }

  return { data: computeTraffic(data ?? []) }
}
