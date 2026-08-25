import { notFound } from 'next/navigation'
import { getStorefrontProduct } from '@/app/actions/catalogue'
import { CATEGORY_LABEL, StockNote } from '@/components/Catalogue.jsx'
import ProductCheckout from '@/components/ProductCheckout.jsx'
import { ArrowLink, Breadcrumb, Eyebrow, Rule } from '@/components/ui.jsx'
import { FileIcon } from '@/components/icons.jsx'
import { PRODUCT_CATEGORIES, categoryHref } from '@/utils/product-categories'

export async function generateMetadata({ params }) {
  const { id } = await params
  const { data } = await getStorefrontProduct(id)

  if (!data) return { title: 'Product — VIP Solar' }

  return {
    title: `${data.name} — VIP Solar`,
    description: data.description ?? undefined,
  }
}

/**
 * One product, and the whole of buying it.
 *
 * The unit is on the left with its documents; the price and the order form
 * are on the right, sticky on a desk so the total stays in view while the
 * address is being typed. On a phone the picture leads and the form follows,
 * which is the order someone reads in anyway.
 *
 * `isInstaller` is resolved on the server and passed down as a plain boolean.
 * It decides what the page *shows*; createOrder() resolves it again
 * from the session before it writes anything, so a browser that lies about it
 * gets a prettier page and the same invoice.
 */
export default async function ProductPage({ params }) {
  const { id } = await params
  const { data: product, isInstaller, signedIn } = await getStorefrontProduct(id)

  // A malformed id, a discontinued product and one that never existed are the
  // same event to a customer: this page is not here.
  if (!product) notFound()

  const category = PRODUCT_CATEGORIES.find((c) => c.key === product.category) ?? null

  return (
    <main id="content" className="pt-nav">
      <section className="band-sheet rail py-16 lg:py-24">
        <div className="rail-inner">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Products', href: category ? categoryHref(category) : '/products' },
              ...(category ? [{ label: CATEGORY_LABEL[category.key] }] : []),
              { label: product.name },
            ]}
          />

          <ArrowLink href="/products" className="mt-6">
            <span className="sr-only">Back to </span>All products
          </ArrowLink>

          <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_26rem] lg:gap-16">
            {/* ------------------------------- the unit ------------------------------ */}
            <div className="min-w-0">
              <Eyebrow>Product</Eyebrow>
              <h1 className="display-wide text-display-2 text-ink mt-5 font-semibold text-balance">{product.name}</h1>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <StockNote stock={product.stock_quantity} />
                {product.is_bulk_only && (
                  <span className="label border-rule-strong bg-glare text-ink-soft inline-flex items-center rounded-full border px-2 py-1">
                    Bulk order
                  </span>
                )}
              </div>

              <div className="border-rule bg-glare rounded-panel mt-8 flex items-center justify-center border p-8">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-auto max-h-[22rem] w-auto max-w-full object-contain"
                  />
                ) : (
                  <span className="text-hush flex h-56 items-center">
                    <FileIcon className="h-10 w-10" />
                  </span>
                )}
              </div>

              {product.description && (
                <p className="text-ink-soft max-w-measure mt-8 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              )}

              {product.specifications?.length > 0 && (
                <>
                  <Rule className="mt-10" />
                  <h2 className="display-wide text-display-3 text-ink mt-8 font-semibold">Technical specification</h2>
                  <p className="text-ink-soft mt-3 text-sm leading-relaxed">
                    Every figure below is transcribed from the manufacturer&apos;s datasheet, which is linked in full
                    underneath.
                  </p>

                  <dl className="border-rule rounded-panel mt-8 overflow-hidden border">
                    {product.specifications.map((spec, i) => {
                      // A datasheet is grouped — PV input, battery, efficiency,
                      // general data — and forty rows read as a wall without
                      // those divisions. A leading "# " marks a heading, which
                      // is also what an admin types into the Maintenance tab.
                      if (spec.startsWith('#')) {
                        return (
                          <div
                            key={i}
                            className="border-rule bg-sheet/60 border-y px-4 py-2 first:border-t-0"
                          >
                            <dt className="label text-ink font-medium">{spec.replace(/^#+\s*/, '')}</dt>
                          </div>
                        )
                      }

                      const split = spec.indexOf(':')
                      const label = split === -1 ? null : spec.slice(0, split).trim()
                      const value = split === -1 ? spec : spec.slice(split + 1).trim()

                      return (
                        <div
                          key={i}
                          className="border-rule flex flex-col gap-1 border-b px-4 py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                        >
                          {label && <dt className="label text-ink-soft sm:shrink-0">{label}</dt>}
                          {/* Some rows are a paragraph of protections rather
                              than a number, so the value wraps and stays left
                              aligned on a phone instead of being squeezed into
                              a column beside its own label. */}
                          <dd className="text-ink font-mono text-sm leading-relaxed font-medium tabular-nums sm:max-w-[60%] sm:text-right">
                            {value}
                          </dd>
                        </div>
                      )
                    })}
                  </dl>
                </>
              )}

              {(product.datasheet_url || product.manual_url) && (
                <>
                  <Rule className="mt-10" />
                  <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                    {product.datasheet_url && (
                      <ArrowLink href={product.datasheet_url} target="_blank" rel="noopener noreferrer">
                        Datasheet (PDF)
                      </ArrowLink>
                    )}
                    {product.manual_url && (
                      <ArrowLink href={product.manual_url} target="_blank" rel="noopener noreferrer">
                        User manual (PDF)
                      </ArrowLink>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* -------------------------------- ordering ------------------------------ */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              <ProductCheckout product={product} isInstaller={isInstaller} signedIn={signedIn} />

              <p className="text-ink-soft mt-5 text-xs leading-relaxed">
                Delivery is arranged after payment clears. For a multi-unit or commercial order, or anything that
                needs to be quoted with installation,{' '}
                <a href="/#footer" className="text-ink underline underline-offset-2">
                  talk to us first
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
