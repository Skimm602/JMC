import { COMPANY, PARTNER_BRANDS, SERVICE_AREAS, TESTIMONIALS } from '@/utils/company'
import { Button, Section, SectionHeading, cx } from './ui.jsx'
import { ArrowUpRightIcon, StarIcon } from './icons.jsx'

/**
 * What other people say, and where we can get to.
 *
 * Two objections close most solar sales and neither is technical: *does this
 * actually work for someone like me*, and *do you even come out this far*.
 * This band answers both, in that order, and ends on the action.
 *
 * The reviews are quoted exactly as they were written — Bisaya, missing
 * apostrophes and all. Tidied into corporate English they would read as copy
 * we wrote about ourselves, which is precisely the thing a testimonial is
 * supposed not to be. The two that state a peso figure lead, because a number
 * a customer volunteered is the most persuasive sentence on this site and the
 * only kind of savings claim we can make without inventing one.
 */
export default function Proof() {
  const [lead, ...rest] = TESTIMONIALS

  return (
    <Section id="proof" className="band-sheet">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SectionHeading>Nine roofs. Every one of them recommends us.</SectionHeading>
        </div>
        <div className="lg:col-span-5 lg:self-end">
          <p className="text-ink-soft max-w-measure leading-relaxed">
            A hundred per cent recommend rate is a small sample honestly reported, not a marketing figure. Here is
            what the sample actually said.
          </p>
        </div>
      </div>

      {/* The lead review gets the scale of a headline because it is one: a
          bill that went from ten thousand to two is the argument, and burying
          it in a grid of equal cards would be the timid arrangement. */}
      <figure className="border-rule bg-glare rounded-panel mt-12 border p-8 lg:p-12">
        <div className="flex items-center gap-1" role="img" aria-label="Five out of five">
          {[1, 2, 3, 4, 5].map((n) => (
            <StarIcon key={n} filled className="text-hot-500 h-4 w-4" />
          ))}
        </div>

        <blockquote className="display-wide text-ink mt-6 max-w-[22ch] text-[clamp(1.75rem,4vw,3rem)] leading-[1.05] font-semibold text-balance">
          {lead.result}
        </blockquote>

        <p className="text-ink-soft max-w-measure mt-6 leading-relaxed">“{lead.quote}”</p>
        <figcaption className="text-ink-soft mt-4 text-sm font-medium">{lead.attribution}</figcaption>
      </figure>

      {/* The rest in a masonry column flow rather than a card grid: the quotes
          are wildly different lengths and forcing them to one height either
          pads the short ones or clips the long ones. */}
      <div className="mt-6 gap-6 sm:columns-2 lg:columns-3">
        {rest.map((t) => (
          <figure key={t.quote} className="border-rule bg-glare rounded-panel mb-6 break-inside-avoid border p-6">
            <p className="text-ink leading-relaxed">“{t.quote}”</p>
            <figcaption className="text-ink-soft mt-4 text-sm font-medium">{t.attribution}</figcaption>
          </figure>
        ))}
      </div>

      {/* ------------------------------- reach -------------------------------- */}
      <div className="border-rule mt-20 border-t pt-14">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <h3 className="display-wide text-ink text-2xl font-semibold">Where we work</h3>
            <p className="text-ink-soft mt-3 max-w-measure text-sm leading-relaxed">
              Crews travel from Ormoc across three provinces. If your town is not on the list, ring us anyway — it is
              usually a question of scheduling rather than distance.
            </p>

            <div className="mt-8 grid gap-6">
              {SERVICE_AREAS.map((area) => (
                <div key={area.province}>
                  <p className="label text-ink-soft">{area.province}</p>
                  <p className="text-ink mt-2 text-sm leading-relaxed">{area.places.join(' · ')}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            <h3 className="display-wide text-ink text-2xl font-semibold">Brands we are authorised to install</h3>
            <p className="text-ink-soft mt-3 max-w-measure text-sm leading-relaxed">
              Being a certified dealer is what puts a warranty claim on our desk instead of yours. Set as names rather
              than logos — we hold the dealership, not permission to redraw seventeen trademarks.
            </p>

            <ul className="mt-8 flex flex-wrap gap-2">
              {PARTNER_BRANDS.map((brand, i) => (
                <li
                  key={brand}
                  className={cx(
                    'rounded-row border px-3.5 py-2 text-sm font-medium',
                    // The two we stock as boxed equipment on this site are the
                    // ones a visitor can click through to a specification, so
                    // they are the ones drawn forward.
                    i < 4
                      ? 'border-cool-600/45 bg-cool-600/[0.07] text-cool-700'
                      : 'border-rule-strong bg-glare text-ink-soft',
                  )}
                >
                  {brand}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Button as="a" href="/#footer">
                Get a free quote
                <ArrowUpRightIcon className="h-4 w-4" />
              </Button>
              <a
                href={COMPANY.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-soft hover:text-ink text-sm font-medium underline underline-offset-2 transition-colors"
              >
                Read every review on Facebook
              </a>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
