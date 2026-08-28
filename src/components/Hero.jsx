import { COMPANY, PARTNER_BRANDS, STATS, TESTIMONIALS } from '@/utils/company'
import { ArrowRightIcon, ArrowUpRightIcon, PhoneIcon } from './icons.jsx'
import Reveal from './Reveal.jsx'

/**
 * A bento, not a band and not a split — and a shop window, not a brochure.
 *
 * The page used to open on the company: what it designs, supplies and
 * installs, with "get a free quote" as the committed action. That is a
 * contractor's opening, and it was the reason the site read as an installer's
 * site rather than as a store. It now opens on the offer a shop makes — the
 * range, the brands behind it, and two doors straight onto stock — with the
 * proof arranged around it rather than in front of it.
 *
 * The headline is the page's only graphic element and is sized as one: two
 * words filling the column, set in two weights of the same blue. Everything
 * that follows is a tile, and every tile holds something true — the photos
 * are commissioned jobs, the figures are the ones the company actually
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

/**
 * A door onto a shelf. The product photograph sits in the same sky-tinted
 * well the category cards use, so a shot on a transparent background has a
 * ground to stand on, and the whole tile is the link — a shop window you can
 * only enter through a small text link is a poster.
 */
function ShopDoor({ href, photo, label, note, className }) {
  return (
    <a
      href={href}
      className={`tile group flex flex-col p-4 transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[0_1px_2px_rgba(15,31,64,0.04),0_28px_54px_-28px_rgba(15,31,64,0.55)] ${className ?? ''}`}
    >
      <div className="tile-sky flex min-h-0 flex-1 items-center justify-center p-3 shadow-none">
        {/* max-h/max-w rather than h-full: this well is a flex child with no
            explicit height, so a percentage height has nothing dependable to
            resolve against — the pair lets the shot shrink to fit whatever
            the row leaves it. */}
        <img
          src={photo}
          alt=""
          className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-navy-900 text-sm font-bold">{label}</p>
          <p className="text-ink-soft mt-0.5 truncate text-xs">{note}</p>
        </div>
        <span
          aria-hidden="true"
          className="border-navy-900/15 text-navy-900 group-hover:bg-solar-500 group-hover:border-solar-500 group-hover:text-navy-950 grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors duration-300"
        >
          <ArrowUpRightIcon className="h-3.5 w-3.5" />
        </span>
      </div>
    </a>
  )
}

export default function Hero({ productCount = 0 }) {
  const phone = COMPANY.phones[0]
  const following = STATS.find((s) => s.label === 'Following')
  const recommend = STATS.find((s) => s.label === 'Recommend rate')
  const quote = TESTIMONIALS[0]
  const brandCount = PARTNER_BRANDS.length

  return (
    <section id="top" className="rail pt-nav pb-6 lg:pb-10">
      <div className="rail-inner pt-10 lg:pt-14">
        {/* ------------------------------ first row ------------------------------ */}
        <div className="grid gap-5 lg:grid-cols-12">
          {/* -------------------------------- the offer --------------------------- */}
          <div className="flex flex-col justify-center lg:col-span-5">
            <Reveal as="p" delay={0} className="chip chip-solar w-fit">
              <span aria-hidden="true" className="bg-solar-500 h-1.5 w-1.5 shrink-0 rounded-full" />
              {productCount > 0 ? `${productCount} lines in stock today` : 'In stock and on the shelf'}
            </Reveal>

            <Reveal as="h1" delay={80} className="text-display-hero mt-6 font-bold">
              <span className="text-sky-500">Buy solar</span>
              <SunMark className="ml-3 inline-block h-[0.4em] w-[0.4em] align-super" />
              <br />
              <span className="text-navy-900">direct.</span>
            </Reveal>

            <Reveal as="p" delay={160} className="text-ink-soft mt-7 max-w-[42ch] leading-relaxed">
              Inverters, batteries and the gear that goes between them — every brand we carry on one counter, boxed,
              specified and ready to go out. Order online, or settle it on the phone in ten minutes.
            </Reveal>

            <Reveal as="div" delay={240} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="/products"
                className="group/cta bg-navy-900 text-glare hover:bg-navy-800 inline-flex h-13 items-center gap-3 rounded-full pr-2 pl-7 text-[0.9375rem] font-semibold shadow-[0_14px_30px_-16px_rgba(15,31,64,0.95)] transition-colors duration-200"
              >
                Shop the range
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

            <Reveal as="p" delay={320} className="text-ink-soft mt-5 text-xs leading-relaxed">
              VAT-inclusive prices · GCash, QR&nbsp;Ph and PesoNet · delivered across Leyte, S.&nbsp;Leyte and Cebu
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

            {/* Two doors straight onto stock, in the place the old hero used
                for a second and third photograph of somebody else's roof. */}
            <Reveal delay={200} className="h-full">
              <ShopDoor
                href="/products/inverters"
                photo="/products/h6-8k-ls.png"
                label="Inverters"
                note="Hybrid, low & high voltage"
                className="h-full"
              />
            </Reveal>

            <Reveal delay={280} className="h-full">
              <ShopDoor
                href="/products/batteries"
                photo="/products/e50-100-h3.png"
                label="Batteries"
                note="LiFePO₄ wall, rack & cabinet"
                className="h-full"
              />
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
                <p className="text-glare text-sm font-semibold">{recommend.figure} recommend rate</p>
                <p className="text-glint-soft mt-0.5 text-xs">{recommend.note}</p>
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

          <Reveal as="div" delay={280} className="tile flex flex-col justify-between p-6 lg:col-span-2">
            <div>
              <p className="text-navy-900 text-3xl leading-none font-bold tabular-nums">{following.figure}</p>
              <p className="text-ink-soft mt-2 text-xs leading-snug">{following.note}</p>
            </div>
            <ReviewerCluster />
          </Reveal>

          {/* The multi-brand claim as a door rather than as a sentence: it is
              the reason to buy here rather than from a single-brand importer,
              so it gets a tile and a link instead of a line of body copy. */}
          <Reveal
            as="a"
            href="/#brands"
            delay={360}
            className="tile-sky group flex flex-col justify-between p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 lg:col-span-2"
          >
            <p className="text-navy-900 text-[clamp(2.5rem,4vw,3.5rem)] leading-none font-bold tabular-nums">
              {brandCount}
            </p>
            <div>
              <p className="text-navy-800/75 text-xs leading-snug">
                brands carried — buy them from one supplier instead of five.
              </p>
              <span className="text-navy-900 mt-3 inline-flex items-center gap-2 text-sm font-semibold">
                Shop by brand
                <ArrowUpRightIcon aria-hidden="true" className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
