import { getStorefront } from '@/app/actions/catalogue'
import Catalogue from '@/components/Catalogue.jsx'
import { PRODUCT_CATEGORIES, categoryHref } from '@/utils/product-categories'
import { ArrowLink, Eyebrow, Rule, SectionHeading } from '@/components/ui.jsx'
import { AlertIcon, InfoIcon } from '@/components/icons.jsx'

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

  return (
    <main id="content" className="pt-nav">
      <section className="band-sheet rail py-20 lg:py-28">
        <div className="rail-inner">
          <Eyebrow>Shop</Eyebrow>
          <SectionHeading className="mt-6">{category.label}</SectionHeading>
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
                  className="rounded-row border-cool-600 bg-cool-600 text-glare border px-3 py-1.5 text-xs font-medium"
                >
                  {c.label}
                </span>
              ) : (
                <a
                  key={c.key}
                  href={categoryHref(c)}
                  className="rounded-row border-rule-strong bg-glare text-ink-soft hover:border-ink-soft hover:text-ink border px-3 py-1.5 text-xs font-medium transition-colors duration-200"
                >
                  {c.label}
                </a>
              ),
            )}
            <a
              href="/products"
              className="rounded-row border-rule-strong bg-glare text-ink-soft hover:border-ink-soft hover:text-ink border px-3 py-1.5 text-xs font-medium transition-colors duration-200"
            >
              Everything
            </a>
          </nav>

          <Rule className="mt-10" />

          {/* Which price someone is looking at is the first thing they will
              want to know, so the page says it rather than leaving them to
              work it out from a number they have nothing to compare against. */}
          <div className="mt-10 flex items-start gap-3">
            <InfoIcon className="text-cool-600 mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-ink-soft max-w-measure text-sm leading-relaxed">
              {isInstaller ? (
                <>
                  You are seeing <span className="text-cool-600 font-medium">installer pricing</span>. List price is
                  shown struck through wherever a trade price applies.
                </>
              ) : signedIn ? (
                <>
                  These are list prices. Installer accounts see trade pricing here automatically —{' '}
                  <ArrowLink href="/register" className="inline-flex">
                    register as an installer
                  </ArrowLink>{' '}
                  if that is you.
                </>
              ) : (
                <>
                  These are list prices, shown VAT-exclusive. Log in to order; installer accounts see trade pricing
                  here automatically.
                </>
              )}
            </p>
          </div>

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
            <div className="border-rule bg-glare mt-12 flex flex-col items-center border border-dashed px-6 py-20 text-center">
              <p className="text-ink-soft max-w-measure text-sm leading-relaxed">{category.empty}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-3">
                <ArrowLink href="/#footer">Ask us for a quote</ArrowLink>
                <ArrowLink href="/products">See what else is in stock</ArrowLink>
              </div>
            </div>
          ) : (
            <Catalogue products={products} isInstaller={isInstaller} category={category.key} />
          )}

          <Rule className="mt-16" />
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
            <ArrowLink href="/faqs">FAQs</ArrowLink>
            <ArrowLink href="/#footer">Talk to us</ArrowLink>
          </div>
        </div>
      </section>
    </main>
  )
}
