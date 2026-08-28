import { ArrowLink } from '@/components/ui.jsx'
import { InfoIcon } from '@/components/icons.jsx'

/** The number a buyer actually rings to get a figure. Also in the footer. */
const TRADE_DESK = '0917 508 8220'

/**
 * What the person looking is being shown, said once for the whole shop.
 *
 * Which price someone is looking at is the first thing they will want to
 * know, and they cannot work it out from a number they have nothing to
 * compare against — so the page says it rather than leaving them to guess.
 *
 * `anyPriced` is read off the catalogue rather than assumed. While no unit on
 * the page carries a peso figure, every sentence about list prices, trade
 * discounts and checkout totals is a claim the shop cannot keep, so the note
 * says the true thing instead: pricing is quoted, here is who quotes it. The
 * moment a real price is saved in the back office the note goes back to
 * explaining list and trade pricing on its own, with nothing to remember to
 * change.
 */
export default function PricingNote({ anyPriced, isInstaller, signedIn }) {
  return (
    <div className="mt-10 flex items-start gap-3">
      <InfoIcon className="text-cool-600 mt-0.5 h-4 w-4 shrink-0" />
      <p className="text-ink-soft max-w-measure text-sm leading-relaxed">
        {!anyPriced ? (
          <>
            Prices are quoted, not listed — ring{' '}
            <a href={`tel:${TRADE_DESK.replace(/\s/g, '')}`} className="text-cool-600 font-medium">
              {TRADE_DESK}
            </a>{' '}
            with the models and quantities, or{' '}
            <a href="/#footer" className="text-ink underline underline-offset-2">
              send us the list
            </a>
            , and the figure comes back the same day: one price for the set, delivered. Installers are quoted at
            trade rates.
          </>
        ) : isInstaller ? (
          <>
            You are seeing <span className="text-cool-600 font-medium">installer pricing</span>. List price is shown
            struck through wherever a trade price applies.
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
            These are list prices, shown VAT-exclusive. Log in to order; installer accounts see trade pricing here
            automatically.
          </>
        )}
      </p>
    </div>
  )
}
