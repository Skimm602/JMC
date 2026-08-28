import { COMPANY, STATS, TESTIMONIALS } from '@/utils/company'
import { ArrowRightIcon, ArrowUpRightIcon, PhoneIcon } from './icons.jsx'
import Reveal from './Reveal.jsx'

/**
 * A bento, not a band and not a split.
 *
 * The page used to open on two solid halves — a navy field of copy beside a
 * photograph — which is a strong shape but a closed one: nothing could be
 * added to it without breaking it in half again. This opens instead on a
 * field of sky with tiles laid on it, so the first screenful carries the
 * headline, four photographs, three figures and a customer's own sentence at
 * once, and the eye is given a route through them rather than a wall.
 *
 * The headline is the page's only graphic element and is sized as one: two
 * words filling the column, set in two weights of the same blue. Everything
 * that follows is a tile, and every tile holds something true — the photos
 * are commissioned jobs, the figures are the four the company actually
 * publishes, and the quote is a review as it was written.
 */

/** The mark that sits in the headline's shoulder. Drawn rather than shipped
    as an emoji so it takes the amber from the palette and stays sharp at the
    size the display scale grows to on a wide display. */
function SunMark({ className }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <circle cx="24" cy="24" r="10" fill="var(--color-solar-400)" />
      <circle cx="24" cy="24" r="10" fill="none" stroke="var(--color-solar-500)" strokeWidth="1.5" />
      <g stroke="var(--color-solar-500)" strokeWidth="3" strokeLinecap="round">
        <path d="M24 3v6M24 39v6M45 24h-6M9 24H3M38.8 9.2l-4.2 4.2M13.4 34.6l-4.2 4.2M38.8 38.8l-4.2-4.2M13.4 13.4L9.2 9.2" />
      </g>
    </svg>
  )
}

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
          className="border-glare text-glare grid h-9 w-9 place-items-center rounded-full border-2 text-xs font-bold"
        >
          {letter}
        </span>
      ))}
    </div>
  )
}

export default function Hero() {
  const phone = COMPANY.phones[0]
  const following = STATS.find((s) => s.label === 'Following')
  const projects = STATS.find((s) => s.label === 'Completed projects')
  const capacities = STATS.find((s) => s.label === 'System capacities')
  const quote = TESTIMONIALS[0]

  return (
    <section id="top" className="rail pt-nav pb-6 lg:pb-10">
      <div className="rail-inner pt-10 lg:pt-14">
        {/* ------------------------------ first row ------------------------------ */}
        <div className="grid gap-5 lg:grid-cols-12">
          {/* -------------------------------- the offer --------------------------- */}
          <div className="flex flex-col justify-center lg:col-span-5">
            <Reveal as="p" delay={0} className="chip chip-solar w-fit">
              <span aria-hidden="true" className="bg-solar-500 h-1.5 w-1.5 shrink-0 rounded-full" />
              Leyte · S. Leyte · Cebu
            </Reveal>

            <Reveal as="h1" delay={80} className="text-display-hero mt-6 font-bold">
              <span className="text-sky-500">Solar</span>
              <SunMark className="ml-3 inline-block h-[0.4em] w-[0.4em] align-super" />
              <br />
              <span className="text-navy-900">Energy.</span>
            </Reveal>

            <Reveal as="p" delay={160} className="text-ink-soft mt-7 max-w-[42ch] leading-relaxed">
              Designed, supplied and installed under a duly licensed electrical engineer, to DOE and ERC standards —
              from a single 6&nbsp;kW roof to megawatt-scale plant.
            </Reveal>

            <Reveal as="div" delay={240} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="/#footer"
                className="group/cta bg-navy-900 text-glare hover:bg-navy-800 inline-flex h-13 items-center gap-3 rounded-full pr-2 pl-7 text-[0.9375rem] font-semibold shadow-[0_14px_30px_-16px_rgba(15,31,64,0.95)] transition-colors duration-200"
              >
                Get a free quote
                <span className="bg-solar-500 text-navy-950 grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform duration-200 group-hover/cta:translate-x-0.5">
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              </a>

              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="text-navy-900 border-navy-900/20 hover:border-navy-900/60 hover:bg-glare inline-flex h-13 items-center justify-center gap-2.5 rounded-full border bg-white/60 px-6 font-mono text-sm font-medium transition-colors duration-200"
              >
                <PhoneIcon className="text-solar-600 h-4 w-4 shrink-0" />
                {phone}
              </a>
            </Reveal>
          </div>

          {/* ------------------------------ the evidence -------------------------- */}
          {/* Three columns, two rows, fixed row height — a bento only reads as one
              if the tiles are cut from a grid rather than sized to their contents.
              Below lg it folds to two columns and the tall tile keeps its span, so
              the arrangement still reads as a composition on a phone. */}
          <div className="grid auto-rows-[9.5rem] grid-cols-2 gap-4 sm:auto-rows-[11rem] lg:col-span-7 lg:auto-rows-[13.75rem] lg:grid-cols-3">
            <Reveal as="figure" delay={120} className="tile-photo row-span-2 h-full">
              <img
                src="/about-sunset.jpg"
                alt="Sunrise at the end of a row of panels on a commissioned array."
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </Reveal>

            <Reveal as="figure" delay={200} className="tile-photo h-full">
              <img
                src="/projects/hospital-30kw.webp"
                alt="A 30 kW on-grid installation on a hospital roof."
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </Reveal>

            {/* The figure the reference floats over its grid, carrying a number
                this company actually publishes rather than an invented one. */}
            <Reveal as="div" delay={280} className="tile flex h-full flex-col justify-between p-5">
              <div>
                <p className="text-navy-900 text-3xl leading-none font-bold tabular-nums">{following.figure}</p>
                <p className="text-ink-soft mt-2 text-xs leading-snug">{following.note}</p>
              </div>
              <ReviewerCluster />
            </Reveal>

            <Reveal as="figure" delay={360} className="tile-photo col-span-2 h-full">
              <img
                src="/hero-array.jpg"
                alt="A commissioned rooftop array in daylight."
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="from-navy-950/85 absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent px-5 pt-12 pb-4"
              >
                <p className="text-glare text-sm font-semibold">{capacities.figure}</p>
                <p className="text-glint-soft mt-0.5 text-xs">{capacities.note}</p>
              </div>
            </Reveal>
          </div>
        </div>

        {/* ------------------------------ second row ------------------------------ */}
        <div className="mt-5 grid gap-5 lg:grid-cols-12">
          {/* The reference's blue card, carrying the strongest sentence this
              company owns: a customer's own, quoted as they typed it. */}
          <Reveal as="figure" delay={120} className="tile-navy relative overflow-hidden p-7 lg:col-span-5">
            <div
              aria-hidden="true"
              className="bg-solar-500/20 pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full blur-3xl"
            />
            <p className="chip chip-shade">
              <span aria-hidden="true" className="bg-solar-400 h-1.5 w-1.5 shrink-0 rounded-full" />
              A real bill, after
            </p>
            <blockquote className="text-glare mt-5 text-[clamp(1.75rem,2.6vw,2.4rem)] leading-[1.05] font-bold">
              {quote.result}
            </blockquote>
            <p className="text-glint-soft mt-4 max-w-[40ch] text-sm leading-relaxed">&ldquo;{quote.quote}&rdquo;</p>
            <figcaption className="text-glint-soft/80 mt-4 text-xs">
              — {quote.attribution}, in their own review
            </figcaption>
          </Reveal>

          <Reveal as="figure" delay={200} className="tile-photo h-56 lg:col-span-3 lg:h-auto">
            <img
              src="/projects/100kwp-broiler-farm.webp"
              alt="A 100 kWp on-grid installation over a broiler farm."
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </Reveal>

          <Reveal as="div" delay={280} className="tile-sky flex flex-col justify-between p-6 lg:col-span-2">
            <p className="text-navy-900 text-[clamp(2.5rem,4vw,3.5rem)] leading-none font-bold tabular-nums">
              {projects.figure}
            </p>
            <p className="text-navy-800/75 mt-3 text-xs leading-snug">
              {projects.label} — {projects.note}
            </p>
          </Reveal>

          <Reveal as="div" delay={360} className="tile flex flex-col justify-between p-6 lg:col-span-2">
            <p className="text-navy-900 text-lg leading-snug font-bold text-balance">{COMPANY.tagline}</p>
            <a
              href="/products"
              className="text-ink-soft hover:text-navy-900 group mt-4 inline-flex items-center gap-2 text-sm font-medium transition-colors"
            >
              See the range
              <span className="border-navy-900/20 group-hover:border-navy-900 group-hover:bg-navy-900 group-hover:text-glare grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors">
                <ArrowUpRightIcon className="h-3.5 w-3.5" />
              </span>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
