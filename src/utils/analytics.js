/**
 * The numbers behind the analytics tab and the downloadable reports — one
 * set of pure functions so the on-screen dashboard and the PDF are always
 * reading the same arithmetic, the same way utils/pricing.js keeps the
 * checkout summary and the server's own total in agreement.
 *
 * Callers pass in orders (as returned by getOrders()) and products (as
 * returned by getProducts()) already fetched — this module never touches
 * the database itself.
 */

/**
 * An order counts as a sale once payment has actually landed. Everything
 * still awaiting payment, and anything cancelled, never happened as far as
 * revenue is concerned — counting it would make the dashboard show money
 * that was never collected.
 */
export const SALE_STATUSES = ['paid', 'processing', 'shipped', 'completed']

/** Same threshold StockTable.jsx already flags a row at — one number, so
    "low" means the same thing wherever it's shown. */
export const LOW_STOCK_THRESHOLD = 3

const isSale = (order) => SALE_STATUSES.includes(order.status)

/** When an order's revenue is recognised: the moment it was paid, or its
    creation time for the rare row that has no paid_at. */
const revenueDate = (order) => new Date(order.paid_at ?? order.created_at)

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const monthLabel = (date) => date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

/** The last `count` months, oldest first, ending with the current month —
    the x-axis for the overview's revenue trend. */
function trailingMonths(count) {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1)
    return { key: monthKey(d), label: monthLabel(d), start: d, end: new Date(d.getFullYear(), d.getMonth() + 1, 1) }
  })
}

/** Every month of `year`, January through December. */
function monthsOfYear(year) {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(year, i, 1)
    return { key: monthKey(d), label: monthLabel(d), start: d, end: new Date(year, i + 1, 1) }
  })
}

function ordersInRange(orders, from, to) {
  return orders.filter((o) => isSale(o) && revenueDate(o) >= from && revenueDate(o) < to)
}

function totalsOf(sold) {
  const revenue = sold.reduce((sum, o) => sum + Number(o.total ?? 0), 0)
  const count = sold.length
  return { revenue, orders: count, avgOrderValue: count ? revenue / count : 0 }
}

/** Revenue and units per product, across a set of already-filtered orders. */
function productSalesOf(sold, { limit = 8 } = {}) {
  const byProduct = new Map()

  for (const order of sold) {
    for (const item of order.order_items ?? []) {
      const product = item.products
      if (!product) continue // a product deleted outright leaves no row to attribute this line to

      const entry = byProduct.get(product.id) ?? {
        id: product.id,
        name: product.name,
        imageUrl: product.image_url,
        unitsSold: 0,
        revenue: 0,
      }
      entry.unitsSold += Number(item.quantity ?? 0)
      entry.revenue += Number(item.quantity ?? 0) * Number(item.price_at_purchase ?? 0)
      byProduct.set(product.id, entry)
    }
  }

  return [...byProduct.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit)
}

function lowStockOf(products) {
  return products
    .filter((p) => p.is_active !== false && Number(p.stock_quantity ?? 0) <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => Number(a.stock_quantity ?? 0) - Number(b.stock_quantity ?? 0))
    .map((p) => ({ id: p.id, name: p.name, stock: Number(p.stock_quantity ?? 0), retailPrice: Number(p.retail_price ?? 0) }))
}

/**
 * computeOverview(orders, products)
 *
 * The analytics tab's data: the last 12 months of revenue, the products
 * that earned it, and what's low on the shelf right now.
 */
export function computeOverview(orders, products) {
  const months = trailingMonths(12)
  const from = months[0].start
  const to = months[months.length - 1].end
  const sold = ordersInRange(orders, from, to)

  const monthly = months.map((m) => {
    const inMonth = sold.filter((o) => revenueDate(o) >= m.start && revenueDate(o) < m.end)
    const { revenue, orders: orderCount } = totalsOf(inMonth)
    return { key: m.key, label: m.label, revenue, orders: orderCount }
  })

  return {
    range: { from, to },
    monthly,
    totals: totalsOf(sold),
    topProducts: productSalesOf(sold, { limit: 8 }),
    lowStock: lowStockOf(products),
  }
}

/**
 * Site traffic. Rows arrive from admin_page_view_daily() already aggregated —
 * one per day that had anybody on it, carrying a Manila date, a visitor count
 * and a page-view count. This turns that sparse list into the two series the
 * traffic section draws.
 */

/** The daily chart's window. Thirty days is as many bars as fit at chart
    width while each still reads as its own day rather than a texture. */
export const TRAFFIC_DAYS = 30

/** Manila's date, wherever this runs. Vercel's servers keep UTC, so asking
    the host what day it is would roll "today" over at eight in the morning. */
const manilaToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())

/** 'YYYY-MM-DD' to a Date at local midnight. new Date(iso) reads a bare date
    as UTC and lands on the day before for everyone east of Greenwich, which
    is every visitor this site has. */
function parseDay(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const dayKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/**
 * computeTraffic(rows, { days, months })
 *
 * The traffic section's data: a bar per day for the last month, a total per
 * month for the last year, and the few figures worth reading at a glance.
 */
export function computeTraffic(rows, { days = TRAFFIC_DAYS, months = 12 } = {}) {
  const byDay = new Map(
    (rows ?? []).map((r) => [
      r.viewed_on,
      { visitors: Number(r.visitors ?? 0), views: Number(r.views ?? 0) },
    ]),
  )

  const today = parseDay(manilaToday())

  // Every day in the window, quiet ones included. A missing bar reads as "no
  // data"; a zero-height one reads as "nobody came", and only the second is
  // what an empty day means.
  const daily = Array.from({ length: days }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1 - i))
    const found = byDay.get(dayKey(date)) ?? { visitors: 0, views: 0 }
    return {
      key: dayKey(date),
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tickLabel: String(date.getDate()),
      visitors: found.visitors,
      views: found.views,
    }
  })

  // Monthly totals sum the daily counts, so somebody who came back on three
  // separate days counts three times. That is deliberate, and it is the only
  // total these rows can honestly produce: recognising one person across a
  // whole month would mean keeping something that identifies them for a
  // month, which is the thing page_views is built not to do.
  const buckets = new Map()
  for (const [iso, value] of byDay) {
    const key = iso.slice(0, 7)
    const entry = buckets.get(key) ?? { visitors: 0, views: 0 }
    entry.visitors += value.visitors
    entry.views += value.views
    buckets.set(key, entry)
  }

  const monthly = Array.from({ length: months }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (months - 1 - i), 1)
    const found = buckets.get(monthKey(d)) ?? { visitors: 0, views: 0 }
    return {
      key: monthKey(d),
      label: monthLabel(d),
      tickLabel: monthLabel(d).split(' ')[0],
      visitors: found.visitors,
      views: found.views,
    }
  })

  const currentMonth = monthly[monthly.length - 1]
  const todayRow = daily[daily.length - 1]
  const busiest = daily.reduce((best, d) => (d.visitors > best.visitors ? d : best), daily[0])

  return {
    daily,
    monthly,
    totals: {
      today: todayRow.visitors,
      thisMonth: currentMonth.visitors,
      thisMonthViews: currentMonth.views,
      thisMonthLabel: currentMonth.label,
      busiest,
      windowVisitors: daily.reduce((sum, d) => sum + d.visitors, 0),
    },
  }
}

/**
 * computeReport(orders, products, { period, year, month })
 *
 * period: 'monthly' (needs `year` and `month`, 1-12) or 'yearly' (needs `year`).
 * The document behind the "Download report" button — same shape as the
 * overview, scoped to one period, with the full low-stock list rather than
 * a dashboard-sized slice.
 */
export function computeReport(orders, products, { period, year, month }) {
  const isMonthly = period === 'monthly'
  const from = isMonthly ? new Date(year, month - 1, 1) : new Date(year, 0, 1)
  const to = isMonthly ? new Date(year, month, 1) : new Date(year + 1, 0, 1)
  const sold = ordersInRange(orders, from, to)

  const monthly = isMonthly
    ? []
    : monthsOfYear(year).map((m) => {
        const inMonth = sold.filter((o) => revenueDate(o) >= m.start && revenueDate(o) < m.end)
        const { revenue, orders: orderCount } = totalsOf(inMonth)
        return { key: m.key, label: m.label, revenue, orders: orderCount }
      })

  return {
    period,
    label: isMonthly ? from.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : String(year),
    range: { from, to },
    monthly,
    totals: totalsOf(sold),
    topProducts: productSalesOf(sold, { limit: 10 }),
    lowStock: lowStockOf(products),
  }
}
