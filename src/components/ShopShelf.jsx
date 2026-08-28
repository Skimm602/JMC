import Link from 'next/link'
import { formatPeso, isPriced, unitPriceOf, withVat } from '@/utils/pricing'
import { brandOf } from '@/utils/brands'
import { PRODUCT_CATEGORIES, categoryHref } from '@/utils/product-categories'
import { Eyebrow, SectionHeading, TwoTone, cx } from './ui.jsx'
import { ArrowRightIcon, ArrowUpRightIcon, CartIcon, FileIcon } from './icons.jsx'
import Reveal from './Reveal.jsx'

/**
 * The shop, on the front page.
 *
 * The home page used to send a visitor to three category doors and then talk
 * about the company for four sections. That is the shape of a contractor's
 * site: it describes a service and asks you to enquire. A shop puts stock in
 * front of you, with its picture, its price and a way to buy it, before it
 * asks you to believe anything — so this is real rows out of the catalogue,
 * twelve of them, on the first screenful, in the same cards the shop floor
 * uses.
 *
 * The products are fetched once by the page and passed to this and to the
 * hero, so the front page makes one catalogue query rather than three.
 *
 * It renders nothing at all when the catalogue is empty or unreachable. An
 * empty shelf under a heading that says "in stock now" is worse for the sale
 * than no shelf, and the sections around it stand on their own.
 */

/** Singular type label for a card's chip, read off the same list the shop is
    divided by so the two can never name a category differently. */
const TYPE_LABEL = Object.fromEntries(
  PRODUCT_CATEGORIES.map((c) => [c.key, c.label.replace(/ies$/, 'y').replace(/s$/, '')]),
)

/**
 * Twelve units that show the range rather than twelve of the same thing.
 *
 * Taken round-robin across the types, because the point this shelf has to
 * make in its first rows is breadth — a visitor who sees eight inverters
 * concludes we sell inverters. In-stock lines are preferred, but a shelf that
 * would come out nearly empty falls back to the whole catalogue rather than
 * disappearing.
 */
function pickFeatured(products, limit) {
  const inStock = products.filter((p) => p.stock_quantity !== 0)
  const pool = inStock.length >= 4 ? inStock : products

  const byType = new Map()
  for (const product of pool) {
    const key = product.category ?? 'other'
    if (!byType.has(key)) byType.set(key, [])
    byType.get(key).push(product)
  }

  const queues = [...byType.values()]
  const picked = []

  while (picked.length < limit && queues.some((q) => q.length)) {
    for (const queue of queues) {
      if (picked.length >= limit) break
      if (queue.length) picked.push(queue.shift())
    }
  }

  return picked
}

function ShelfCard({ product, isInstaller }) {
  const brand = brandOf(product)
  const priced = isPriced(product)
  const soldOut = product.stock_quantity === 0
  const low = product.stock_quantity > 0 && product.stock_quantity <= 5

  return (
    <Link
      href={`/products/${product.id}`}
      className="tile group flex h-full flex-col p-4 transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[0_1px_2px_rgba(15,31,64,0.04),0_28px_54px_-28px_rgba(15,31,64,0.55)]"
    >
      <div className="tile-sky relative flex h-44 items-center justify-center p-5 shadow-none">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className={cx(
              'h-full w-auto object-contain transition-transform duration-500 group-hover:scale-105',
              soldOut && 'opacity-45',
            )}
          />
        ) : (
          <FileIcon className="text-hush h-8 w-8" />
        )}

        {/* Scarcity where it is real, and only where it is real: the count
            comes off the shelf, so "Only 3 left" is a fact rather than a
            pressure tactic somebody typed into the copy. */}
        {(low || soldOut) && (
          <span
            className={cx(
              'label absolute top-3 left-3 rounded-full px-2.5 py-1',
              soldOut ? 'bg-hot-600 text-glare' : 'bg-solar-500 text-navy-950',
            )}
          >
            {soldOut ? 'Sold out' : `Only ${product.stock_quantity} left`}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        {brand && <span className="text-solar-600 label">{brand}</span>}
        {TYPE_LABEL[product.category] && (
          <span className="text-hush label">
            <span aria-hidden="true">· </span>
            {TYPE_LABEL[product.category]}
          </span>
        )}
      </div>

      <h3 className="text-navy-900 group-hover:text-solar-600 mt-2 font-mono text-sm font-medium transition-colors">
        {product.name}
      </h3>

      <div className="mt-auto pt-5">
        {priced ? (
          <p className="text-navy-900 font-mono text-lg font-semibold tabular-nums">
            {formatPeso(withVat(unitPriceOf(product, isInstaller)))}
            <span className="text-ink-soft ml-1.5 font-sans text-[0.6875rem] font-normal">VAT in</span>
          </p>
        ) : (
          <p className="text-navy-900 text-base font-semibold">
            Price on request
            <span className="text-ink-soft ml-1.5 text-[0.6875rem] font-normal">same-day</span>
          </p>
        )}

        <span
          className={cx(
            'mt-4 flex h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors duration-200',
            soldOut
              ? 'border-navy-900/15 text-ink-soft border'
              : 'bg-navy-900 text-glare group-hover:bg-solar-500 group-hover:text-navy-950',
          )}
        >
          {soldOut ? 'Back in soon' : priced ? 'Buy it' : 'Get the price'}
          {!soldOut && <ArrowRightIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
        </span>
      </div>
    </Link>
  )
}

export default function ShopShelf({ products = [], isInstaller = false }) {
  const featured = pickFeatured(products, 12)
  if (featured.length === 0) return null

  return (
    /* Not `Section`: its py-20/28 would put a screenful of sky between the
       banner and the first product card, which is exactly what the owner
       asked to be rid of. The shelf starts immediately and takes its air at
       the bottom, where the page carries on. */
    <section id="shop" className="rail relative scroll-mt-nav pt-6 pb-20 lg:pt-8 lg:pb-28">
      <div className="rail-inner">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div>
            <Eyebrow>Buy now</Eyebrow>
            <SectionHeading className="mt-4">
              <TwoTone light="On the shelf" dark="today." />
            </SectionHeading>
          </div>

          {/* The shelves, as a row of capsules beside the heading rather than
              a section of their own further down. Somebody who came for a
              battery should be one click from the battery page without
              scrolling past twelve inverters to find the door. */}
          <nav aria-label="Shelves" className="flex flex-wrap items-center gap-2">
            {PRODUCT_CATEGORIES.map((c) => (
              <Link
                key={c.key}
                href={categoryHref(c)}
                className="border-navy-900/15 text-ink-soft hover:border-navy-900/50 hover:text-navy-900 inline-flex h-10 items-center rounded-full border bg-white/60 px-4 text-sm font-medium transition-colors duration-200"
              >
                {c.label}
              </Link>
            ))}
            <Link
              href="/products"
              className="bg-navy-900 border-navy-900 text-glare hover:bg-navy-800 inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold transition-colors duration-200"
            >
              All {products.length}
            </Link>
          </nav>
        </div>

        {/* No lede here on purpose: a paragraph between the heading and the
            first card is another 70px of reading before anything can be
            bought. What it said now sits under the grid, where somebody who
            has already looked at the stock will read it. */}
        <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {featured.map((product, i) => (
            <Reveal key={product.id} delay={(i % 4) * 70} className="h-full">
              <ShelfCard product={product} isInstaller={isInstaller} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-ink-soft max-w-measure text-sm leading-relaxed">
            <span className="text-navy-900 font-semibold">{products.length} lines</span> in the catalogue right now,
            boxed and counted. Every unit ships with its manufacturer&apos;s warranty and the datasheet it was
            specified from.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/products"
              className="group/cta bg-navy-900 text-glare hover:bg-navy-800 inline-flex h-12 items-center gap-3 rounded-full pr-2 pl-6 text-sm font-semibold shadow-[0_14px_30px_-16px_rgba(15,31,64,0.95)] transition-colors duration-200"
            >
              Shop everything
              <span className="bg-solar-500 text-navy-950 grid h-8 w-8 shrink-0 place-items-center rounded-full transition-transform duration-200 group-hover/cta:translate-x-0.5">
                <ArrowUpRightIcon className="h-4 w-4" />
              </span>
            </Link>

            <Link
              href="/cart"
              className="text-navy-900 border-navy-900/20 hover:border-navy-900/60 hover:bg-glare inline-flex h-12 items-center gap-2.5 rounded-full border bg-white/60 px-5 text-sm font-medium transition-colors duration-200"
            >
              <CartIcon className="text-solar-600 h-4 w-4 shrink-0" />
              Your cart
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
