import { getStorefront } from '@/app/actions/catalogue'
import Catalogue from '@/components/Catalogue.jsx'
import { ArrowLink, Eyebrow, Rule, SectionHeading } from '@/components/ui.jsx'
import { AlertIcon, InfoIcon } from '@/components/icons.jsx'

export const metadata = {
  title: 'Products — VIP Solar',
  description:
    'Hybrid inverters and LiFePO₄ storage in stock, with prices. Trade pricing applies automatically to installer accounts.',
}

/**
 * The shop. Its own route rather than a band on the home page, because this
 * is where prices, stock and ordering live, and none of those belong in the
 * middle of an argument about why the equipment is good.
 *
 * The home page keeps the engineering side of the range — the spec tables and
 * the manufacturer's datasheets — and the two link to each other rather than
 * one trying to be both.
 */
export default async function ProductsPage() {
  const { data, error, isInstaller, signedIn } = await getStorefront()

  return (
    <main id="content" className="pt-nav">
      <section className="band-sheet rail py-20 lg:py-28">
        <div className="rail-inner">
          <Eyebrow>Shop</Eyebrow>
          <SectionHeading className="mt-6">Products and pricing</SectionHeading>
          <p className="text-ink-soft max-w-measure mt-6 leading-relaxed">
            Everything below is priced and stocked. Pick a unit to see what it costs delivered, fill in where it
            goes, and check the total before you commit to it.
          </p>

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
              className="border-hot-600/40 bg-hot-600/[0.06] text-ink mt-10 flex items-start gap-2.5 border px-3.5 py-3 text-sm leading-relaxed"
            >
              <AlertIcon className="text-hot-600 mt-0.5 h-4 w-4 shrink-0" />
              The catalogue could not be loaded: {error}
            </p>
          ) : (
            <Catalogue products={data ?? []} isInstaller={isInstaller} />
          )}

          <Rule className="mt-16" />
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
            <ArrowLink href="/#products">Full technical range and datasheets</ArrowLink>
            <ArrowLink href="/#sizing">Size a system</ArrowLink>
          </div>
        </div>
      </section>
    </main>
  )
}
