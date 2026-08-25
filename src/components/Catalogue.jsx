'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { formatPeso, isPriced, unitPriceOf, withVat } from '@/utils/pricing'
import { Rule, cx } from './ui.jsx'
import { ArrowRightIcon, CheckIcon, ChevronDownIcon, FileIcon } from './icons.jsx'

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
        <p className="text-ink-soft mt-1.5 text-xs">Quoted on enquiry, delivered and installed.</p>
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
 * Who made it, read off the model number.
 *
 * There is no `brand` column on the products table, and adding one would mean
 * every product sat brandless until somebody ran the migration and filled it
 * in — a filter that lists nothing is worse than no filter. The model numbers
 * already carry the answer unambiguously (a manufacturer's series prefix is
 * the one part of a model number that never collides), so it is read from
 * there instead.
 *
 * Longest prefix wins, so a future 'GW-SOMETHING-LB-EU' cannot be caught by a
 * shorter rule that happens to sit earlier in the list.
 */
const BRAND_RULES = [
  ['GEN2-LB-EU', 'LuxpowerTek'],
  ['T-BAT-SYS', 'SolaX'],
  ['S6-EH1P', 'Solis'],
  ['HYX-', 'HYXiPOWER'],
  ['GW', 'GoodWe'],
]

/** The brand of one product, or null when the name matches no known series. */
function brandOf(product) {
  const name = (product.name ?? '').trim().toUpperCase()

  let best = null
  for (const [prefix, brand] of BRAND_RULES) {
    if (!name.startsWith(prefix.toUpperCase())) continue
    if (!best || prefix.length > best[0].length) best = [prefix, brand]
  }

  return best ? best[1] : null
}

/** Anything the rules do not recognise is still reachable, under one heading. */
const OTHER_BRAND = 'Other'

export const CATEGORY_LABEL = { inverter: 'Inverter', battery: 'Battery', accessory: 'Accessory' }
const VOLTAGE_LABEL = { low: 'Low voltage', high: 'High voltage' }

/**
 * The shelves the shop is laid out on.
 *
 * One flat grid asks a customer to read every card before they learn that
 * four of them are batteries and the rest are inverters. Splitting the grid
 * says it up front, and the filter bar still narrows within it.
 *
 * A product whose type has not been set in the back office lands on the last
 * shelf rather than disappearing: it is still stocked, still priced and still
 * orderable, and dropping it silently would be the worst of the options.
 */
const CATEGORY_GROUPS = [
  {
    key: 'inverter',
    heading: 'Inverters',
    blurb: 'Hybrid inverters — the box between the array, the battery and the switchboard.',
  },
  {
    key: 'battery',
    heading: 'Batteries',
    blurb: 'LiFePO₄ storage, low and high voltage, rack and cabinet.',
  },
  {
    key: 'accessory',
    heading: 'Accessories',
    blurb: 'Mounting, wiring and the other parts an install needs beyond the inverter and battery.',
  },
  {
    key: 'uncategorised',
    heading: 'Other equipment',
    blurb: 'Stocked lines that do not sit in either group above.',
  },
]

const shelfOf = (product) => (CATEGORY_LABEL[product.category] ? product.category : 'uncategorised')

function ProductCard({ product, isInstaller }) {
  const soldOut = product.stock_quantity === 0

  return (
    <Link
      href={`/products/${product.id}`}
      className="group border-rule bg-glare hover:border-ink-soft rounded-panel flex flex-col border p-6 transition-colors duration-200"
    >
      <div className="bg-sheet rounded-card flex h-56 items-center justify-center p-4">
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

      <h3 className="text-ink group-hover:text-cool-600 mt-4 font-mono text-[0.9375rem] font-medium transition-colors">
        {product.name}
      </h3>

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

/**
 * The brand picker. A dropdown rather than another row of segmented buttons
 * because the brand list grows every time a supplier is added, and five
 * suppliers already wrap the filter bar onto another line.
 *
 * It opens on hover, which is what makes it quick to skim, but hover alone
 * would leave it unusable on a phone and unreachable from a keyboard — so a
 * press toggles it too, and Escape closes it. The panel is a DOM child of the
 * hover target, so moving the pointer down into it does not count as leaving.
 */
function BrandFilter({ brands, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const total = brands.reduce((n, b) => n + b.count, 0)
  const options = [{ name: 'all', label: 'All brands', count: total }, ...brands.map((b) => ({ ...b, label: b.name }))]

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cx(
          'rounded-row flex items-center gap-2 border px-3 py-1.5 text-xs font-medium transition-colors duration-200',
          value === 'all'
            ? 'border-rule-strong bg-glare text-ink-soft hover:border-ink-soft hover:text-ink'
            : 'border-cool-600 bg-cool-600 text-glare',
        )}
      >
        {value === 'all' ? 'All brands' : value}
        <ChevronDownIcon className={cx('h-3 w-3 shrink-0 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        /* pt-1 rather than mt-1: the gap between the button and the panel is
           inside the panel's own box, so the pointer never crosses dead space
           on its way down and the menu does not shut under the cursor. */
        <div role="listbox" className="animate-reveal absolute top-full left-0 z-20 pt-1">
          <div className="border-rule bg-glare rounded-card min-w-[13rem] border p-1 shadow-lg">
            {options.map((o) => {
              const on = value === o.name
              return (
                <button
                  key={o.name}
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => {
                    onChange(o.name)
                    setOpen(false)
                  }}
                  className={cx(
                    'rounded-row flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition-colors',
                    on ? 'text-cool-600' : 'text-ink-soft hover:bg-sheet hover:text-ink',
                  )}
                >
                  <CheckIcon className={cx('h-3.5 w-3.5 shrink-0', on ? 'opacity-100' : 'opacity-0')} />
                  <span className="flex-1">{o.label}</span>
                  <span className="text-hush tabular-nums">{o.count}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const DEFAULT_FILTERS = { query: '', category: 'all', voltage: 'all', brand: 'all', minPrice: '', maxPrice: '' }

function FilterBar({ filters, setFilters, priceBounds, brands, showType = true }) {
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }))

  const active =
    filters.query !== '' ||
    filters.category !== 'all' ||
    filters.voltage !== 'all' ||
    filters.brand !== 'all' ||
    filters.minPrice !== '' ||
    filters.maxPrice !== ''

  return (
    <div className="border-rule bg-sheet/50 mt-10 flex flex-wrap items-end gap-x-8 gap-y-5 border p-5">
      <div className="w-full">
        <span className="label text-ink-soft mb-2 block">Search</span>
        <input
          type="search"
          value={filters.query}
          onChange={(e) => set({ query: e.target.value })}
          placeholder="Model, wattage, brand, feature…"
          className="border-rule-strong bg-glare text-ink focus:border-ink w-full max-w-md border px-3.5 py-2 text-sm outline-none"
        />
      </div>

      {showType && (
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
            <FilterOption active={filters.category === 'accessory'} onClick={() => set({ category: 'accessory' })}>
              Accessories
            </FilterOption>
          </div>
        </div>
      )}

      {brands.length > 1 && (
        <div>
          <span className="label text-ink-soft mb-2 block">Brand</span>
          <BrandFilter brands={brands} value={filters.brand} onChange={(brand) => set({ brand })} />
        </div>
      )}

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

      {/* A price range over a catalogue that carries no prices can only ever
          return nothing: the predicate below drops every unpriced product as
          soon as a bound is set, so the control would answer "nothing matches
          that" to every number typed into it. priceBounds is already null
          when nothing is priced, which makes it the test for whether there is
          anything here to filter — and the control comes back on its own the
          day a real figure is saved. */}
      {priceBounds.min != null && (
        <div>
          <span className="label text-ink-soft mb-2 block">Price range (₱)</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              placeholder={String(Math.floor(priceBounds.min))}
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
      )}

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

/**
 * `category` puts the grid on a page that is already one type — /products/
 * inverters and its two siblings. There it drops the shelf headings and the
 * Type filter, because both would be restating the page's own title. Without
 * it the grid is the whole shop, split into shelves.
 */
export default function Catalogue({ products, isInstaller, category = null }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  const priceBounds = useMemo(() => {
    const priced = (products ?? []).filter(isPriced).map((p) => unitPriceOf(p, isInstaller))
    if (!priced.length) return { min: null, max: null }
    return { min: Math.min(...priced), max: Math.max(...priced) }
  }, [products, isInstaller])

  const brands = useMemo(() => {
    const counts = new Map()
    for (const product of products ?? []) {
      const brand = brandOf(product) ?? OTHER_BRAND
      counts.set(brand, (counts.get(brand) ?? 0) + 1)
    }

    // Named brands alphabetically, with the catch-all last wherever it falls.
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) =>
        a.name === OTHER_BRAND ? 1 : b.name === OTHER_BRAND ? -1 : a.name.localeCompare(b.name),
      )
  }, [products])

  const filtered = useMemo(() => {
    const min = filters.minPrice === '' ? null : Number(filters.minPrice)
    const max = filters.maxPrice === '' ? null : Number(filters.maxPrice)
    const query = filters.query.trim().toLowerCase()

    return (products ?? []).filter((product) => {
      // Name, description and the spec sheet itself — a customer typing
      // "IP66" or "40-60V" is searching the datasheet, not the blurb, and
      // the spec lines are exactly that, already on the row.
      if (query) {
        const haystack = [
          product.name,
          product.description,
          CATEGORY_LABEL[product.category],
          VOLTAGE_LABEL[product.voltage_class],
          // "solis" appears nowhere in "S6-EH1P 8K", so searching the brand
          // only works if the brand is put into the haystack deliberately.
          brandOf(product),
          ...(product.specifications ?? []),
        ]
          .filter(Boolean)
          .join(' \n ')
          .toLowerCase()

        if (!haystack.includes(query)) return false
      }

      if (filters.category !== 'all' && product.category !== filters.category) return false
      if (filters.brand !== 'all' && (brandOf(product) ?? OTHER_BRAND) !== filters.brand) return false
      if (filters.voltage !== 'all' && product.voltage_class !== filters.voltage) return false

      if (min != null || max != null) {
        if (!isPriced(product)) return false
        const price = unitPriceOf(product, isInstaller)
        if (min != null && price < min) return false
        if (max != null && price > max) return false
      }

      return true
    })
  }, [products, filters, isInstaller])

  // Empty shelves are left out rather than rendered as a heading over
  // nothing — filtering to "Batteries" should not leave an Inverters bar
  // sitting above a blank row.
  const shelves = useMemo(
    () =>
      CATEGORY_GROUPS.map((group) => ({
        ...group,
        products: filtered.filter((product) => shelfOf(product) === group.key),
      })).filter((group) => group.products.length > 0),
    [filtered],
  )

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
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        priceBounds={priceBounds}
        brands={brands}
        showType={!category}
      />

      <p className="text-ink-soft mt-4 text-xs">
        Showing {filtered.length} of {products.length} {products.length === 1 ? 'product' : 'products'}
      </p>

      {filtered.length === 0 ? (
        <div className="border-rule bg-glare mt-6 flex flex-col items-center border border-dashed px-6 py-16 text-center">
          <FileIcon className="text-hush h-8 w-8" />
          <p className="text-ink-soft max-w-measure mt-5 text-sm leading-relaxed">
            Nothing matches that. Try a different search term, widening the price range, or clearing a filter.
          </p>
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="text-cool-600 mt-4 text-sm font-medium underline underline-offset-2"
          >
            Clear filters
          </button>
        </div>
      ) : category ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} isInstaller={isInstaller} />
          ))}
        </div>
      ) : (
        <div>
          {/* Jump links only earn their place when there is more than one
              shelf to jump between. */}
          {shelves.length > 1 && (
            <nav aria-label="Product types" className="mt-6 flex flex-wrap gap-2">
              {shelves.map((shelf) => (
                <a
                  key={shelf.key}
                  href={`#shelf-${shelf.key}`}
                  className="rounded-row border-rule-strong bg-glare text-ink-soft hover:border-ink-soft hover:text-ink border px-3 py-1.5 text-xs font-medium transition-colors duration-200"
                >
                  {shelf.heading}
                  <span className="text-hush ml-1.5 tabular-nums">{shelf.products.length}</span>
                </a>
              ))}
            </nav>
          )}

          {shelves.map((shelf, i) => (
            <section
              key={shelf.key}
              id={`shelf-${shelf.key}`}
              aria-labelledby={`shelf-${shelf.key}-heading`}
              className={cx('scroll-mt-28', i === 0 ? 'mt-8' : 'mt-16')}
            >
              <Rule />

              <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <h2 id={`shelf-${shelf.key}-heading`} className="display-wide text-ink text-xl font-semibold">
                  {shelf.heading}
                </h2>
                <p className="text-ink-soft text-xs tabular-nums">
                  {shelf.products.length} {shelf.products.length === 1 ? 'product' : 'products'}
                </p>
              </div>

              <p className="text-ink-soft max-w-measure mt-2 text-sm leading-relaxed">{shelf.blurb}</p>

              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {shelf.products.map((product) => (
                  <ProductCard key={product.id} product={product} isInstaller={isInstaller} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
