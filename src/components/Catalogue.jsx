import Link from 'next/link'
import { formatPeso, isPriced, unitPriceOf, VAT_RATE } from '@/utils/pricing'
import { cx } from './ui.jsx'
import { ArrowRightIcon, FileIcon } from './icons.jsx'

/**
 * The shop floor. Server-rendered on purpose — a card is a picture, a price
 * and a link, and none of that needs JavaScript to arrive. The interactive
 * part of buying starts one click later, on the product's own page.
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
          <s>{formatPeso(list)}</s>
        </p>
      )}

      <p
        className={cx(
          'text-ink font-mono font-semibold tabular-nums',
          size === 'lg' ? 'text-display-3 mt-1' : 'mt-0.5 text-lg',
        )}
      >
        {formatPeso(price)}
      </p>

      <p className="text-ink-soft mt-1.5 text-xs">
        {discounted && <span className="text-cool-600 font-medium">Installer price · </span>}
        VAT-exclusive · {Math.round(VAT_RATE * 100)} % added at checkout
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
        'label inline-flex items-center border px-2 py-1',
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

function ProductCard({ product, isInstaller }) {
  const soldOut = product.stock_quantity === 0

  return (
    <Link
      href={`/products/${product.id}`}
      className="group border-rule bg-glare hover:border-ink-soft flex flex-col border p-6 transition-colors duration-200"
    >
      <div className="bg-sheet flex h-44 items-center justify-center p-4">
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
          <span className="label border-rule-strong bg-sheet text-ink-soft inline-flex items-center border px-2 py-1">
            Bulk order
          </span>
        )}
      </div>

      <h2 className="text-ink group-hover:text-cool-600 mt-4 font-mono text-[0.9375rem] font-medium transition-colors">
        {product.name}
      </h2>

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

export default function Catalogue({ products, isInstaller }) {
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
    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} isInstaller={isInstaller} />
      ))}
    </div>
  )
}
