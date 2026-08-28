import { COMPANY, PARTNER_BRANDS, TESTIMONIALS } from '@/utils/company'
import { ArrowRightIcon, ArrowUpRightIcon, PhoneIcon } from './icons.jsx'
import Reveal from './Reveal.jsx'

/**
 * A banner, not a bento — because the products come next and they come
 * immediately.
 *
 * This opened on a full screenful of tiles: a display headline, four
 * photographs, a figure and a customer quote, all before a single thing that
 * could be bought appeared. The owner's instruction was that entering the
 * home page should show the products themselves straight away, the way a
 * shop front does. So the opening is now one short band — the offer, the
 * price-free proof beside it, and the two buttons — sized so the first row of
 * the shelf below is already on screen when the page lands.
 *
 * Everything cut from here still exists further down the page: the
 * photographs in Projects, the category doors in ProductCategories, the
 * capacities and credentials in About.
 */

/** The cluster the reference stacks beside its community figure. We have no
    photographs of the people who left these reviews and will not invent any,
    so it is built from the initials of the attributions themselves. */
const CLUSTER_FILLS = ['#162d5a', '#1e3a6e', '#0b5c9c', '#5285d0']

function ReviewerCluster() {
  const initials = TESTIMONIALS.slice(0, 4).map((t) => t.attribution.trim()[0].toUpperCase())

  return (
    <div aria-hidden="true" className="flex -space-x-2.5">
      {initials.map((letter, i) => (
        <span
          key={i}
          style={{ backgroundColor: CLUSTER_FILLS[i] }}
          className="border-navy-900 text-glare grid h-8 w-8 place-items-center rounded-full border-2 text-[0.6875rem] font-bold"
        >
          {letter}
        </span>
      ))}
    </div>
  )
}

export default function Hero({ productCount = 0 }) {
  const phone = COMPANY.phones[0]
  const quote = TESTIMONIALS[0]
  const brandCount = PARTNER_BRANDS.length

  return (
    <section id="top" className="rail pt-nav pb-4 lg:pb-5">
      <div className="rail-inner pt-5 lg:pt-7">
        <div className="grid gap-4 lg:grid-cols-12">
          {/* ------------------------------- the offer ---------------------------- */}
          <Reveal className="tile-photo relative min-h-[19rem] sm:min-h-[20rem] lg:col-span-8 lg:min-h-[21rem]">
            <img
              src="/hero-array.jpg"
              alt="A commissioned rooftop array in daylight."
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Read left, photograph right. The scrim is a horizontal ramp
                rather than a flat wash so the array is still a photograph on
                the side the copy does not use. */}
            <div
              aria-hidden="true"
              className="from-navy-950 via-navy-950/85 absolute inset-0 bg-gradient-to-r to-transparent"
            />

            <div className="relative flex h-full flex-col justify-center p-7 sm:p-9 lg:p-10">
              <p className="chip chip-shade w-fit">
                <span aria-hidden="true" className="bg-solar-400 h-1.5 w-1.5 shrink-0 rounded-full" />
                {productCount > 0 ? `${productCount} lines in stock today` : 'In stock and on the shelf'}
              </p>

              <h1 className="text-display-1 text-glare mt-5 max-w-[14ch] font-bold">
                Buy solar <span className="text-sky-400">direct.</span>
              </h1>

              <p className="text-glint-soft mt-4 max-w-[46ch] text-sm leading-relaxed sm:text-base">
                Inverters, batteries and the gear between them — every brand we carry on one counter, boxed and
                ready to go out.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="#shop"
                  className="group/cta bg-solar-500 text-navy-950 hover:bg-solar-400 inline-flex h-12 items-center gap-3 rounded-full pr-2 pl-6 text-[0.9375rem] font-semibold transition-colors duration-200"
                >
                  Shop the range
                  <span className="bg-navy-950 text-solar-400 grid h-8 w-8 shrink-0 place-items-center rounded-full transition-transform duration-200 group-hover/cta:translate-x-0.5">
                    <ArrowRightIcon className="h-4 w-4" />
                  </span>
                </a>

                <a
                  href={`tel:${phone.replace(/\s/g, '')}`}
                  className="text-glare hover:border-glare/60 inline-flex h-12 items-center justify-center gap-2.5 rounded-full border border-white/25 px-5 font-mono text-sm font-medium transition-colors duration-200"
                >
                  <PhoneIcon className="text-solar-400 h-4 w-4 shrink-0" />
                  {phone}
                </a>
              </div>
            </div>
          </Reveal>

          {/* ------------------------------- the proof ---------------------------- */}
          {/* Two short tiles rather than one tall one, so the column reads at
              the same rhythm as the shelf underneath it. */}
          <div className="grid gap-4 lg:col-span-4">
            <Reveal as="figure" className="tile-navy relative overflow-hidden p-6">
              <div
                aria-hidden="true"
                className="bg-solar-500/20 pointer-events-none absolute -top-14 -right-14 h-44 w-44 rounded-full blur-3xl"
              />
              <p className="chip chip-shade">
                <span aria-hidden="true" className="bg-solar-400 h-1.5 w-1.5 shrink-0 rounded-full" />
                A real bill, after
              </p>
              <blockquote className="text-glare mt-4 text-[clamp(1.6rem,2.2vw,2.1rem)] leading-[1.05] font-bold">
                {quote.result}
              </blockquote>
              <figcaption className="text-glint-soft/80 mt-3 text-xs leading-relaxed">
                &ldquo;{quote.quote.split('..')[0]}&rdquo; — {quote.attribution}
              </figcaption>
              <div className="mt-4">
                <ReviewerCluster />
              </div>
            </Reveal>

            <Reveal
              as="a"
              href="/#brands"
              className="tile-sky group flex items-center justify-between gap-4 p-6 transition-transform duration-300 hover:-translate-y-1"
            >
              <div>
                <p className="text-navy-900 text-[clamp(2rem,3vw,2.75rem)] leading-none font-bold tabular-nums">
                  {brandCount}
                </p>
                <p className="text-navy-800/75 mt-2 text-xs leading-snug">
                  brands on one invoice — <span className="font-semibold">shop by brand</span>
                </p>
              </div>
              <span
                aria-hidden="true"
                className="border-navy-900/15 text-navy-900 group-hover:bg-solar-500 group-hover:border-solar-500 group-hover:text-navy-950 grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-colors duration-300"
              >
                <ArrowUpRightIcon className="h-4 w-4" />
              </span>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
