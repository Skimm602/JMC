import { getStorefront } from '@/app/actions/catalogue'
import Catalogue from '@/components/Catalogue.jsx'
import PricingNote from '@/components/PricingNote.jsx'
import { isPriced } from '@/utils/pricing'
import { ArrowLink, Breadcrumb, Eyebrow, Rule, SectionHeading } from '@/components/ui.jsx'
import { AlertIcon } from '@/components/icons.jsx'

export const metadata = {
  title: 'Products — VIP Solar',
  description:
    'Hybrid inverters and LiFePO₄ storage in stock, with full specifications and datasheets. Trade rates for registered installer accounts.',
}

/**
 * The whole shop, split into shelves. `/products/inverters` and its two
 * siblings are where the header menu sends people when they already know
 * what they want — this page stays as the one place that shows all of it at
 * once, for anyone who wants that instead.
 */
export default async function ProductsPage() {
  const { data, error, isInstaller, signedIn } = await getStorefront()
  const products = data ?? []

  // Whether the shop is currently quoting or selling off a price list. Every
  // sentence below that mentions a figure depends on it.
  const anyPriced = products.some(isPriced)

  return (
    <main id="content" className="pt-nav">
      <section className="band-sheet rail py-20 lg:py-28">
        <div className="rail-inner">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Products' }]} />

          <Eyebrow className="mt-6">Shop</Eyebrow>
          <SectionHeading className="mt-6">Products and pricing</SectionHeading>
          <p className="text-ink-soft max-w-measure mt-6 leading-relaxed">
            {anyPriced ? (
              <>
                Everything below is priced and stocked. Pick a unit to see what it costs delivered, fill in where it
                goes, and check the total before you commit to it.
              </>
            ) : (
              <>
                Everything below is in stock, with its full specification and the manufacturer&apos;s datasheet. What
                it costs is settled on the phone — tell us the load, the roof and where it is going, and you get one
                figure for the set rather than a line of list prices to add up.
              </>
            )}
          </p>

          <Rule className="mt-10" />

          <PricingNote anyPriced={anyPriced} isInstaller={isInstaller} signedIn={signedIn} />

          {error ? (
            <p
              role="alert"
              className="border-hot-600/40 bg-hot-600/[0.06] text-ink rounded-row mt-10 flex items-start gap-2.5 border px-3.5 py-3 text-sm leading-relaxed"
            >
              <AlertIcon className="text-hot-600 mt-0.5 h-4 w-4 shrink-0" />
              The catalogue could not be loaded: {error}
            </p>
          ) : (
            <Catalogue products={products} isInstaller={isInstaller} />
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
