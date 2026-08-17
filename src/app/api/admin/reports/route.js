import { createElement } from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { readAdminSession } from '@/utils/admin-session'
import { getOrders } from '@/app/actions/orders'
import { getProducts } from '@/app/actions/catalogue'
import { computeReport } from '@/utils/analytics'
import ReportDocument from '@/components/admin/reports/ReportDocument.jsx'

/**
 * GET /api/admin/reports?period=monthly&year=2026&month=8
 * GET /api/admin/reports?period=yearly&year=2026
 *
 * A route handler rather than a server action because the point is a file
 * download — a response with a Content-Disposition header, which an action
 * has no way to hand back to the browser. Everything it reads goes through
 * the same admin gate and the same getOrders()/getProducts() the analytics
 * tab uses, so a downloaded report can't disagree with what the tab showed
 * when it was generated.
 */
export async function GET(request) {
  const { isAdmin } = await readAdminSession()
  if (!isAdmin) return new Response('Not authorized', { status: 403 })

  const url = new URL(request.url)
  const period = url.searchParams.get('period')
  const year = Number(url.searchParams.get('year'))
  const month = Number(url.searchParams.get('month'))

  if (period !== 'monthly' && period !== 'yearly') {
    return new Response('period must be "monthly" or "yearly"', { status: 400 })
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return new Response('year is required', { status: 400 })
  }
  if (period === 'monthly' && (!Number.isInteger(month) || month < 1 || month > 12)) {
    return new Response('month (1-12) is required for a monthly report', { status: 400 })
  }

  const [orders, products] = await Promise.all([getOrders(), getProducts()])
  if (orders.error) return new Response(orders.error, { status: 500 })
  if (products.error) return new Response(products.error, { status: 500 })

  const report = computeReport(orders.data ?? [], products.data ?? [], { period, year, month })
  const buffer = await renderToBuffer(createElement(ReportDocument, { report }))

  const filename =
    period === 'monthly'
      ? `vip-solar-report-${year}-${String(month).padStart(2, '0')}.pdf`
      : `vip-solar-report-${year}.pdf`

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
