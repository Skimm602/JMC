'use client'

import { useMemo, useState } from 'react'
import { Button, cx } from '../ui.jsx'
import { Select } from '../form.jsx'
import { AlertIcon, ChartIcon, DownloadIcon, TableIcon } from '../icons.jsx'
import RevenueChart from './charts/RevenueChart.jsx'
import RankedBars from './charts/RankedBars.jsx'

/**
 * The analytics tab: revenue trend, top products and low stock, each
 * readable as a table or a graph, plus the downloadable monthly/yearly PDF.
 *
 * Every number here comes from getAnalyticsOverview() — the same
 * getOrders()/getProducts() reads Orders and Maintenance already use, only
 * one status list decides what counts as a sale. There is no separate
 * analytics query to drift out of sync with what those two pages show.
 */

const peso = (n) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(n ?? 0))

const pesoCompact = (n, { compact } = {}) => {
  if (!compact) return peso(n)
  const value = Number(n ?? 0)
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `₱${(value / 1_000).toFixed(1)}K`
  return `₱${Math.round(value)}`
}

function StatTile({ label, value, tone = 'ink' }) {
  return (
    <div className="border-rule bg-glare border p-5">
      <p className="label text-ink-soft">{label}</p>
      <p
        className={cx(
          'display-wide text-display-3 mt-2 font-mono font-semibold tabular-nums',
          tone === 'hot' ? 'text-hot-600' : 'text-ink',
        )}
      >
        {value}
      </p>
    </div>
  )
}

/** The Table/Graph switch every section shares — two icon-labelled buttons
    reading as one control, same shape as a segmented toggle. */
function ViewToggle({ view, onChange }) {
  return (
    <div className="border-rule-strong inline-flex border">
      {[
        { id: 'table', label: 'Table', icon: TableIcon },
        { id: 'graph', label: 'Graph', icon: ChartIcon },
      ].map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-pressed={view === id}
          className={cx(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
            view === id ? 'bg-cool-600 text-glare' : 'text-ink-soft hover:text-ink',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}

function Section({ title, description, view, onViewChange, children }) {
  return (
    <section className="border-rule bg-glare border p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-ink text-lg font-semibold">{title}</h2>
          {description && <p className="text-ink-soft mt-1 text-sm leading-relaxed">{description}</p>}
        </div>
        <ViewToggle view={view} onChange={onViewChange} />
      </div>
      <div className="mt-6">{children}</div>
    </section>
  )
}

const LOW_STOCK_NOTE = 'Active products at or below the same low-stock line Maintenance flags them at.'

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'long' }),
}))

function ReportDownload() {
  const currentYear = new Date().getFullYear()
  const years = [currentYear, currentYear - 1, currentYear - 2]

  const [period, setPeriod] = useState('monthly')
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  const href =
    period === 'monthly'
      ? `/api/admin/reports?period=monthly&year=${year}&month=${month}`
      : `/api/admin/reports?period=yearly&year=${year}`

  return (
    <section className="border-rule bg-glare border p-6">
      <h2 className="text-ink text-lg font-semibold">Download report</h2>
      <p className="text-ink-soft mt-1 text-sm leading-relaxed">
        A PDF snapshot for the books — revenue, orders, top products and everything low on the shelf, for one month
        or one year.
      </p>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="grid w-36 gap-1.5">
          <span className="label text-ink-soft">Period</span>
          <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </Select>
        </label>

        {period === 'monthly' && (
          <label className="grid w-40 gap-1.5">
            <span className="label text-ink-soft">Month</span>
            <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </label>
        )}

        <label className="grid w-28 gap-1.5">
          <span className="label text-ink-soft">Year</span>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </label>

        <Button as="a" href={href} target="_blank" rel="noopener noreferrer">
          <DownloadIcon className="h-4 w-4" />
          Download PDF
        </Button>
      </div>
    </section>
  )
}

export default function Analytics({ data }) {
  const [revenueView, setRevenueView] = useState('graph')
  const [productsView, setProductsView] = useState('graph')
  const [stockView, setStockView] = useState('table')

  const { totals, monthly, topProducts, lowStock } = data

  const productItems = useMemo(
    () => topProducts.map((p) => ({ id: p.id, name: p.name, value: p.revenue, unitsSold: p.unitsSold })),
    [topProducts],
  )
  const stockItems = useMemo(
    () => lowStock.map((p) => ({ id: p.id, name: p.name, value: p.stock })),
    [lowStock],
  )

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Revenue · last 12 months" value={peso(totals.revenue)} />
        <StatTile label="Orders · last 12 months" value={totals.orders} />
        <StatTile label="Average order value" value={peso(totals.avgOrderValue)} />
        <StatTile label="Low stock items" value={lowStock.length} tone={lowStock.length > 0 ? 'hot' : 'ink'} />
      </div>

      <Section
        title="Revenue"
        description="Paid, processing, shipped and completed orders, by the month they were paid."
        view={revenueView}
        onViewChange={setRevenueView}
      >
        {revenueView === 'graph' ? (
          <RevenueChart months={monthly} formatValue={pesoCompact} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-left">
              <thead>
                <tr className="border-rule border-b">
                  {['Month', 'Orders', 'Revenue'].map((h) => (
                    <th key={h} className={cx('label text-ink-soft px-3 py-2 font-medium', h !== 'Month' && 'text-right')}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthly.map((m) => (
                  <tr key={m.key} className="border-rule border-b last:border-b-0">
                    <td className="text-ink px-3 py-2 text-sm">{m.label}</td>
                    <td className="text-ink-soft px-3 py-2 text-right font-mono text-xs">{m.orders}</td>
                    <td className="text-ink px-3 py-2 text-right font-mono text-sm">{peso(m.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section
        title="Top products"
        description="Ranked by revenue, over the same 12 months."
        view={productsView}
        onViewChange={setProductsView}
      >
        {productItems.length === 0 ? (
          <p className="text-ink-soft text-sm">No sales in the last 12 months.</p>
        ) : productsView === 'graph' ? (
          <RankedBars items={productItems} formatValue={peso} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-left">
              <thead>
                <tr className="border-rule border-b">
                  {['Product', 'Units sold', 'Revenue'].map((h) => (
                    <th key={h} className={cx('label text-ink-soft px-3 py-2 font-medium', h !== 'Product' && 'text-right')}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.id} className="border-rule border-b last:border-b-0">
                    <td className="text-ink px-3 py-2 text-sm">{p.name}</td>
                    <td className="text-ink-soft px-3 py-2 text-right font-mono text-xs">{p.unitsSold}</td>
                    <td className="text-ink px-3 py-2 text-right font-mono text-sm">{peso(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section
        title="Low stock"
        description={LOW_STOCK_NOTE}
        view={stockView}
        onViewChange={setStockView}
      >
        {stockItems.length === 0 ? (
          <p className="text-ink-soft flex items-center gap-2 text-sm">Nothing is low right now.</p>
        ) : stockView === 'graph' ? (
          <RankedBars items={stockItems} formatValue={(n) => `${n} left`} tone="hot" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-left">
              <thead>
                <tr className="border-rule border-b">
                  {['Product', 'In stock', 'Retail price'].map((h) => (
                    <th key={h} className={cx('label text-ink-soft px-3 py-2 font-medium', h !== 'Product' && 'text-right')}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id} className="border-rule border-b last:border-b-0">
                    <td className="text-ink px-3 py-2 text-sm">{p.name}</td>
                    <td className="text-hot-600 px-3 py-2 text-right font-mono text-xs font-medium">
                      <AlertIcon className="mr-1 inline h-3 w-3" />
                      {p.stock}
                    </td>
                    <td className="text-ink px-3 py-2 text-right font-mono text-sm">{peso(p.retailPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <ReportDownload />
    </div>
  )
}
