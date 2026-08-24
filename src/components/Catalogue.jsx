'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { formatPeso, isPriced, unitPriceOf, withVat } from '@/utils/pricing'
import { cx } from './ui.jsx'
import { ArrowRightIcon, FileIcon, StarIcon } from './icons.jsx'

/**
 * The shop floor. The grid itself is a picture, a price and a link, and none
 * of that needs JavaScript — but the filter bar above it does, so the whole
 * thing runs client-side over the products the server already fetched rather
 * than round-tripping for every filter change.
 */

/**
 * What a product costs, said the same way on the grid and on the detail page.
 *
 * When trade pricing applies the list price stays visible, struck through:
 * the discount is the point, and a number that has quietly been replaced does
 * not read as a saving. `line-through` alone would be decoration, so the list
 * price is also announced as the price it was.
 */
export function PriceTag({ product, isInstaller, size = 'md' }) {
  const price = unitPriceOf(product, isInstaller)
  const list = Number(product.retail_price)
  const discounted = isInstaller && product.installer_price != null && price < list

  // A product whose peso figure has not been set yet. Saying so is the whole
  // job here — rendering the zero it actually holds would read as free, and
  // hiding the product entirely would lose the specification and the
  // datasheet somebody came to read.
  if (!isPriced(product)) {
    return (
      <div>
        <p
          className={cx(
            'text-ink font-medium',
            size === 'lg' ? 'text-display-3 font-display display-wide' : 'text-lg',
          )}
        >
          Price on request
        </p>
        <p className="text-ink-soft mt-1.5 text-xs">Ask us for a quote — this line is not on general sale yet.</p>
      </div>
    )
  }

  return (
    <div>
      {discounted && (
        <p className="text-ink-soft font-mono text-sm">
          <span className="sr-only">List price </span>
          <s>{formatPeso(withVat(list))}</s>
        </p>
      )}

      <p
        className={cx(
          'text-ink font-mono font-semibold tabular-nums',
          size === 'lg' ? 'text-display-3 mt-1' : 'mt-0.5 text-lg',
        )}
      >
        {formatPeso(withVat(price))}
      </p>

      <p className="text-ink-soft mt-1.5 text-xs">
        {discounted && <span className="text-cool-600 font-medium">Installer price · </span>}
        VAT-inclusive
      </p>
    </div>
  )
}

/**
 * Stock as a sentence rather than a count. "In stock" is all a buyer needs
 * until the number gets small enough to change what they do about it, and
 * a null quantity means the shelf is not being tracked for that line — which
 * is not the same as zero and must not be shown as it.
 */
export function StockNote({ stock, className }) {
  if (stock == null) return null

  const out = stock === 0
  const low = stock > 0 && stock <= 5

  return (
    <p
      className={cx(
        'label inline-flex items-center rounded-full border px-2 py-1',
        out
          ? 'border-hot-600/45 bg-hot-600/[0.06] text-hot-700'
          : low
            ? 'border-rule-strong bg-sheet text-ink-soft'
            : 'border-cool-600/45 bg-cool-600/[0.07] text-cool-700',
        className,
      )}
    >
      {out ? 'Out of stock' : low ? `Only ${stock} left` : 'In stock'}
    </p>
  )
}

/**
 * Five stars, filled up to the rating. Half a star rounds down to whole
 * stars visually — the number next to it is what carries the precision.
 */
export function RatingStars({ rating, className }) {
  if (rating == null) return null
  const value = Number(rating)

  return (
    <div className={cx('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <StarIcon key={n} filled={n <= Math.round(value)} className="text-cool-600 h-3.5 w-3.5" />
        ))}
      </div>
      <span className="text-ink-soft text-xs tabular-nums">{value.toFixed(1)}</span>
    </div>
  )
}

const CATEGORY_LABEL = { inverter: 'Inverter', battery: 'Battery' }
const VOLTAGE_LABEL = { low: 'Low voltage', high: 'High voltage' }

function ProductCard({ product, isInstaller }) {
  const soldOut = product.stock_quantity === 0

  return (
    <Link
      href={`/products/${product.id}`}
      className="group border-rule bg-glare hover:border-ink-soft rounded-panel flex flex-col border p-6 transition-colors duration-200"
    >
      <div className="bg-sheet rounded-card flex h-44 items-center justify-center p-4">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className={cx('h-full w-auto object-contain transition-opacity', soldOut && 'opacity-45')}
          />
        ) : (
          <FileIcon className="text-hush h-8 w-8" />
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <StockNote stock={product.stock_quantity} />
        {product.is_bulk_only && (
          <span className="label border-rule-strong bg-sheet text-ink-soft inline-flex items-center rounded-full border px-2 py-1">
            Bulk order
          </span>
        )}
        {product.category && (
          <span className="label border-rule-strong bg-sheet text-ink-soft inline-flex items-center rounded-full border px-2 py-1">
            {CATEGORY_LABEL[product.category]}
            {product.voltage_class ? ` · ${VOLTAGE_LABEL[product.voltage_class]}` : ''}
          </span>
        )}
      </div>

      <h2 className="text-ink group-hover:text-cool-600 mt-4 font-mono text-[0.9375rem] font-medium transition-colors">
        {product.name}
      </h2>

      {product.rating != null && <RatingStars rating={product.rating} className="mt-2" />}

      {product.description && (
        <p className="text-ink-soft mt-2 line-clamp-3 text-sm leading-relaxed">{product.description}</p>
      )}

      {/* mt-auto keeps every price on the same line across a row of cards
          whose descriptions are different lengths */}
      <div className="mt-auto pt-6">
        <PriceTag product={product} isInstaller={isInstaller} />

        <span className="text-ink-soft group-hover:text-ink mt-5 flex items-center gap-2 text-sm font-medium transition-colors">
          <span className="border-b border-current/40 pb-px transition-colors group-hover:border-current">
            {/* Promising "order" on a card that cannot be ordered from is the
                kind of small lie that costs a click and some goodwill. */}
            {isPriced(product) ? 'View and order' : 'View specification'}
          </span>
          <ArrowRightIcon
            aria-hidden="true"
            className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
          />
        </span>
      </div>
    </Link>
  )
}

/** One segmented-control button, shared by the type and voltage filters. */
function FilterOption({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'rounded-row border px-3 py-1.5 text-xs font-medium transition-colors duration-200',
        active
          ? 'border-cool-600 bg-cool-600 text-glare'
          : 'border-rule-strong bg-glare text-ink-soft hover:border-ink-soft hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

const RATING_OPTIONS = [4, 3, 2, 1]
const DEFAULT_FILTERS = { category: 'all', voltage: 'all', minRating: 0, minPrice: '', maxPrice: '' }

function FilterBar({ filters, setFilters, priceBounds }) {
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }))

  const active =
    filters.category !== 'all' ||
    filters.voltage !== 'all' ||
    filters.minRating !== 0 ||
    filters.minPrice !== '' ||
    filters.maxPrice !== ''

  return (
    <div className="border-rule bg-sheet/50 mt-10 flex flex-wrap items-end gap-x-8 gap-y-5 border p-5">
      <div>
        <span className="label text-ink-soft mb-2 block">Type</span>
        <div className="flex flex-wrap gap-2">
          <FilterOption active={filters.category === 'all'} onClick={() => set({ category: 'all' })}>
            All
          </FilterOption>
          <FilterOption active={filters.category === 'inverter'} onClick={() => set({ category: 'inverter' })}>
            Inverters
          </FilterOption>
          <FilterOption active={filters.category === 'battery'} onClick={() => set({ category: 'battery' })}>
            Batteries
          </FilterOption>
        </div>
      </div>

      <div>
        <span className="label text-ink-soft mb-2 block">Voltage</span>
        <div className="flex flex-wrap gap-2">
          <FilterOption active={filters.voltage === 'all'} onClick={() => set({ voltage: 'all' })}>
            All
          </FilterOption>
          <FilterOption active={filters.voltage === 'low'} onClick={() => set({ voltage: 'low' })}>
            Low voltage
          </FilterOption>
          <FilterOption active={filters.voltage === 'high'} onClick={() => set({ voltage: 'high' })}>
            High voltage
          </FilterOption>
        </div>
      </div>

      <div>
        <span className="label text-ink-soft mb-2 block">Rating</span>
        <div className="flex flex-wrap gap-2">
          <FilterOption active={filters.minRating === 0} onClick={() => set({ minRating: 0 })}>
            Any
          </FilterOption>
          {RATING_OPTIONS.map((n) => (
            <FilterOption key={n} active={filters.minRating === n} onClick={() => set({ minRating: n })}>
              <span className="inline-flex items-center gap-1">
                {n}
                <StarIcon filled className="h-3 w-3" />+
              </span>
            </FilterOption>
          ))}
        </div>
      </div>

      <div>
        <span className="label text-ink-soft mb-2 block">Price range (₱)</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            placeholder={priceBounds.min != null ? String(Math.floor(priceBounds.min)) : 'Min'}
            value={filters.minPrice}
            onChange={(e) => set({ minPrice: e.target.value })}
            className="border-rule-strong bg-glare text-ink focus:border-ink w-28 border px-3 py-1.5 text-xs outline-none"
          />
          <span className="text-ink-soft text-xs">–</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            placeholder={priceBounds.max != null ? String(Math.ceil(priceBounds.max)) : 'Max'}
            value={filters.maxPrice}
            onChange={(e) => set({ maxPrice: e.target.value })}
            className="border-rule-strong bg-glare text-ink focus:border-ink w-28 border px-3 py-1.5 text-xs outline-none"
          />
        </div>
      </div>

      {active && (
        <button
          type="button"
          onClick={() => setFilters(DEFAULT_FILTERS)}
          className="text-ink-soft hover:text-ink ml-auto self-center text-xs font-medium underline underline-offset-2"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

export default function Catalogue({ products, isInstaller }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  const priceBounds = useMemo(() => {
    const priced = (products ?? []).filter(isPriced).map((p) => unitPriceOf(p, isInstaller))
    if (!priced.length) return { min: null, max: null }
    return { min: Math.min(...priced), max: Math.max(...priced) }
  }, [products, isInstaller])

  const filtered = useMemo(() => {
    const min = filters.minPrice === '' ? null : Number(filters.minPrice)
    const max = filters.maxPrice === '' ? null : Number(filters.maxPrice)

    return (products ?? []).filter((product) => {
      if (filters.category !== 'all' && product.category !== filters.category) return false
      if (filters.voltage !== 'all' && product.voltage_class !== filters.voltage) return false
      if (filters.minRating > 0 && !(Number(product.rating) >= filters.minRating)) return false

      if (min != null || max != null) {
        if (!isPriced(product)) return false
        const price = unitPriceOf(product, isInstaller)
        if (min != null && price < min) return false
        if (max != null && price > max) return false
      }

      return true
    })
  }, [products, filters, isInstaller])

  if (!products?.length) {
    return (
      <div className="border-rule bg-glare mt-12 flex flex-col items-center border border-dashed px-6 py-20 text-center">
        <FileIcon className="text-hush h-8 w-8" />
        <p className="text-ink-soft max-w-measure mt-5 text-sm leading-relaxed">
          Nothing is listed for sale yet. The range and its datasheets are on the home page in the meantime, and
          pricing appears here as soon as stock is loaded.
        </p>
      </div>
    )
  }

  return (
    <div>
      <FilterBar filters={filters} setFilters={setFilters} priceBounds={priceBounds} />

      <p className="text-ink-soft mt-4 text-xs">
        Showing {filtered.length} of {products.length} {products.length === 1 ? 'product' : 'products'}
      </p>

      {filtered.length === 0 ? (
        <div className="border-rule bg-glare mt-6 flex flex-col items-center border border-dashed px-6 py-16 text-center">
          <FileIcon className="text-hush h-8 w-8" />
          <p className="text-ink-soft max-w-measure mt-5 text-sm leading-relaxed">
            Nothing matches those filters. Try widening the price range or clearing a filter.
          </p>
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="text-cool-600 mt-4 text-sm font-medium underline underline-offset-2"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} isInstaller={isInstaller} />
          ))}
        </div>
      )}
    </div>
  )
}
