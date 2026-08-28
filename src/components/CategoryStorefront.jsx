import { getStorefront } from '@/app/actions/catalogue'
import Catalogue from '@/components/Catalogue.jsx'
import PricingNote from '@/components/PricingNote.jsx'
import { isPriced } from '@/utils/pricing'
import { PRODUCT_CATEGORIES, categoryHref } from '@/utils/product-categories'
import { ArrowLink, Eyebrow, SectionHeading } from '@/components/ui.jsx'
import { AlertIcon } from '@/components/icons.jsx'

/**
 * One type of product, and nothing else on the page.
 *
 * /products is still the whole shop for anyone who wants to see it in one
 * place, but the header menu sends people here instead: somebody who came for
 * a battery should not have to filter thirteen inverters out of the way
 * first, and a page that is only batteries can say something useful at the
 * top instead of a sentence that has to cover the entire catalogue.
 *
 * A server component, so the type is decided and the query is narrowed before
 * anything reaches the browser. The grid below is still the same client
 * component the whole-shop page uses — it just runs in single-type mode,
 * without the shelf headings or the Type filter that would restate the title.
 */
export default async function CategoryStorefront({ category }) {
  const { data, error, isInstaller, signedIn } = await getStorefront(category.key)
  const products = data ?? []
  const anyPriced = products.some(isPriced)

  return (
    <main id="content" className="pt-nav">
      <section className="rail py-20 lg:py-28">
        <div className="rail-inner">
          <Eyebrow>Shop</Eyebrow>
          <SectionHeading className="text-display-1 mt-5">{category.label}</SectionHeading>
          <p className="text-ink-soft max-w-measure mt-6 leading-relaxed">{category.lede}</p>

          {/* Sideways rather than back-and-in: someone comparing an inverter
              against a battery should not have to return to a hub page
              between the two. The type they are on is marked rather than
              linked, because a link to the page you are already on is a
              small dead end. */}
          <nav aria-label="Product types" className="mt-8 flex flex-wrap gap-2">
            {PRODUCT_CATEGORIES.map((c) =>
              c.key === category.key ? (
                <span
                  key={c.key}
                  aria-current="page"
                  className="border-navy-900 bg-navy-900 text-glare inline-flex h-9 items-center rounded-full border px-4 text-xs font-medium"
                >
                  {c.label}
                </span>
              ) : (
                <a
                  key={c.key}
                  href={categoryHref(c)}
                  className="border-navy-900/15 bg-glare text-ink-soft hover:border-navy-900/50 hover:text-navy-900 inline-flex h-9 items-center rounded-full border px-4 text-xs font-medium transition-colors duration-200"
                >
                  {c.label}
                </a>
              ),
            )}
            <a
              href="/products"
              className="border-navy-900/15 bg-glare text-ink-soft hover:border-navy-900/50 hover:text-navy-900 inline-flex h-9 items-center rounded-full border px-4 text-xs font-medium transition-colors duration-200"
            >
              Everything
            </a>
          </nav>

          <PricingNote anyPriced={anyPriced} isInstaller={isInstaller} signedIn={signedIn} />

          {error ? (
            <p
              role="alert"
              className="border-hot-600/40 bg-hot-600/[0.06] text-ink rounded-row mt-10 flex items-start gap-2.5 border px-3.5 py-3 text-sm leading-relaxed"
            >
              <AlertIcon className="text-hot-600 mt-0.5 h-4 w-4 shrink-0" />
              The catalogue could not be loaded: {error}
            </p>
          ) : products.length === 0 ? (
            /* Its own wording per type. The generic "nothing is listed yet"
               is true of an empty accessories shelf but tells the person
               nothing they can act on, and a type we genuinely do stock
               off-site deserves to say so. */
            <div className="tile mt-12 flex flex-col items-center px-6 py-20 text-center">
              <p className="text-ink-soft max-w-measure text-sm leading-relaxed">{category.empty}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-3">
                <ArrowLink href="/#footer">Ask us for a quote</ArrowLink>
                <ArrowLink href="/products">See what else is in stock</ArrowLink>
              </div>
            </div>
          ) : (
            <Catalogue products={products} isInstaller={isInstaller} category={category.key} />
          )}

          <div className="mt-16 flex flex-wrap gap-x-8 gap-y-3">
            <ArrowLink href="/faqs">FAQs</ArrowLink>
            <ArrowLink href="/#footer">Talk to us</ArrowLink>
          </div>
        </div>
      </section>
    </main>
  )
}
