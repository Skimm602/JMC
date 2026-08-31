import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LOW_STOCK_THRESHOLD, SALE_STATUSES, computeOverview, computeReport, computeTraffic } from './analytics.js'

// A fixed "now" so trailingMonths()/monthsOfYear()/manilaToday() are
// deterministic — every test below is dated relative to this instant.
const NOW = new Date('2026-08-15T12:00:00+08:00')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

const order = (overrides = {}) => ({
  id: 'order-1',
  status: 'paid',
  paid_at: '2026-08-10T00:00:00Z',
  created_at: '2026-08-01T00:00:00Z',
  total: 10000,
  order_items: [],
  ...overrides,
})

const product = (overrides = {}) => ({
  id: 'prod-1',
  name: 'HYX-H6K-HS',
  is_active: true,
  stock_quantity: 10,
  retail_price: 6000,
  ...overrides,
})

describe('computeOverview', () => {
  it('counts only orders in a sale status as revenue', () => {
    const orders = [
      order({ status: 'pending', total: 999999 }),
      order({ status: 'approved', total: 999999 }),
      order({ status: 'cancelled', total: 999999 }),
      order({ status: 'paid', total: 5000 }),
    ]

    const result = computeOverview(orders, [])

    expect(result.totals.revenue).toBe(5000)
    expect(result.totals.orders).toBe(1)
    for (const status of SALE_STATUSES) {
      expect(['paid', 'processing', 'shipped', 'completed']).toContain(status)
    }
  })

  it('recognises revenue on paid_at, falling back to created_at when unpaid_at is missing', () => {
    // 13 months before "now" by created_at, but paid_at puts it inside the
    // trailing-12-month window — paid_at must be the one that counts.
    const orders = [order({ paid_at: '2026-08-05T00:00:00Z', created_at: '2025-01-01T00:00:00Z', total: 7000 })]

    const result = computeOverview(orders, [])

    expect(result.totals.revenue).toBe(7000)
  })

  it('excludes a sale outside the trailing 12-month window', () => {
    const orders = [order({ paid_at: '2024-01-01T00:00:00Z', total: 999999 })]

    const result = computeOverview(orders, [])

    expect(result.totals.revenue).toBe(0)
    expect(result.totals.orders).toBe(0)
  })

  it('buckets revenue into the correct month', () => {
    const orders = [order({ paid_at: '2026-08-10T00:00:00Z', total: 1000 }), order({ paid_at: '2026-07-01T00:00:00Z', total: 2000 })]

    const result = computeOverview(orders, [])

    const august = result.monthly.find((m) => m.key === '2026-08')
    const july = result.monthly.find((m) => m.key === '2026-07')
    expect(august.revenue).toBe(1000)
    expect(july.revenue).toBe(2000)
  })

  it('ranks top products by revenue, skips deleted products, and caps at 8', () => {
    const orders = [
      order({
        order_items: [
          { quantity: 2, price_at_purchase: 6000, products: { id: 'p1', name: 'A', image_url: null } },
          { quantity: 1, price_at_purchase: 50000, products: { id: 'p2', name: 'B', image_url: null } },
          { quantity: 5, price_at_purchase: 100, products: null }, // deleted product, must not throw or be counted
        ],
      }),
    ]

    const result = computeOverview(orders, [])

    expect(result.topProducts[0].id).toBe('p2') // 50000 beats 12000
    expect(result.topProducts[0].revenue).toBe(50000)
    expect(result.topProducts[1].id).toBe('p1')
    expect(result.topProducts[1].revenue).toBe(12000)
    expect(result.topProducts).toHaveLength(2)
  })

  it('flags low stock, sorted ascending, excluding inactive products', () => {
    const products = [
      product({ id: 'a', stock_quantity: 2 }),
      product({ id: 'b', stock_quantity: 0 }),
      product({ id: 'c', stock_quantity: 50 }), // above threshold
      product({ id: 'd', stock_quantity: 1, is_active: false }), // inactive, excluded regardless of stock
    ]

    const result = computeOverview([], products)

    expect(result.lowStock.map((p) => p.id)).toEqual(['b', 'a'])
    expect(result.lowStock.every((p) => p.stock <= LOW_STOCK_THRESHOLD)).toBe(true)
  })
})

describe('computeReport', () => {
  it('scopes a monthly report to just that month and carries no monthly breakdown', () => {
    const orders = [
      order({ paid_at: '2026-06-15T00:00:00Z', total: 1000 }), // in June
      order({ paid_at: '2026-07-01T00:00:00Z', total: 5000 }), // out of scope
    ]

    const result = computeReport(orders, [], { period: 'monthly', year: 2026, month: 6 })

    expect(result.totals.revenue).toBe(1000)
    expect(result.monthly).toEqual([])
    expect(result.label).toBe('June 2026')
  })

  it('scopes a yearly report to the whole year, broken down by month', () => {
    const orders = [
      order({ paid_at: '2026-01-10T00:00:00Z', total: 1000 }),
      order({ paid_at: '2026-12-31T00:00:00Z', total: 2000 }),
      order({ paid_at: '2025-12-31T00:00:00Z', total: 999999 }), // previous year, excluded
    ]

    const result = computeReport(orders, [], { period: 'yearly', year: 2026 })

    expect(result.totals.revenue).toBe(3000)
    expect(result.monthly).toHaveLength(12)
    expect(result.monthly.find((m) => m.key === '2026-01').revenue).toBe(1000)
    expect(result.monthly.find((m) => m.key === '2026-12').revenue).toBe(2000)
    expect(result.label).toBe('2026')
  })

  it('lists up to 10 top products, unlike the 8-product overview', () => {
    const items = Array.from({ length: 12 }, (_, i) => ({
      quantity: 1,
      price_at_purchase: 12 - i, // strictly descending, so ranking is unambiguous
      products: { id: `p${i}`, name: `Product ${i}`, image_url: null },
    }))
    const orders = [order({ order_items: items })]

    const result = computeReport(orders, [], { period: 'yearly', year: 2026 })

    expect(result.topProducts).toHaveLength(10)
    expect(result.topProducts[0].id).toBe('p0')
  })
})

describe('computeTraffic', () => {
  it("returns 30 days ending today, filling quiet days with zeros", () => {
    const rows = [{ viewed_on: '2026-08-15', visitors: 12, views: 40 }]

    const result = computeTraffic(rows)

    expect(result.daily).toHaveLength(30)
    expect(result.daily[29].key).toBe('2026-08-15')
    expect(result.daily[29].visitors).toBe(12)
    expect(result.daily[28].visitors).toBe(0) // no row for the day before — a quiet day, not missing data
  })

  it('sums daily counts into monthly totals, and identifies the busiest day', () => {
    const rows = [
      { viewed_on: '2026-08-01', visitors: 5, views: 10 },
      { viewed_on: '2026-08-15', visitors: 20, views: 60 },
    ]

    const result = computeTraffic(rows)

    expect(result.totals.today).toBe(20) // "today" is 2026-08-15
    expect(result.totals.thisMonth).toBe(25)
    expect(result.totals.thisMonthViews).toBe(70)
    expect(result.totals.busiest.key).toBe('2026-08-15')
    expect(result.totals.windowVisitors).toBe(25)
  })
})
