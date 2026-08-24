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
 * "supabase-page-views.sql has not been run yet", in the several dialects the
 * failure arrives in.
 *
 * PGRST202 is the one that actually shows up: PostgREST resolves RPC names
 * against a cached view of the schema and reports a name it has never seen as
 * missing from that cache, without ever reaching Postgres. The SQLSTATEs
 * below are what surfaces when it does reach Postgres — an undefined function
 * or an undefined table — which is the path a dropped object takes after the
 * cache has already learned about it.
 *
 * The message check is the backstop. Codes are the contract, but this is a
 * setup notice rather than a security decision, and showing an admin a raw
 * "could not find the function" string helps nobody.
 */
const NOT_INSTALLED_CODES = ['PGRST202', 'PGRST203', '42883', '42P01']

const isNotInstalled = (error) =>
  NOT_INSTALLED_CODES.includes(error.code) ||
  /schema cache|does not exist|could not find the function/i.test(error.message ?? '')

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
    if (isNotInstalled(error)) return { notInstalled: true }
    return { error: error.message }
  }

  return { data: computeTraffic(data ?? []) }
}
