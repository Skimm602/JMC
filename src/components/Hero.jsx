import { COMPANY, STATS } from '@/utils/company'
import { Button } from './ui.jsx'
import { ArrowUpRightIcon, PhoneIcon } from './icons.jsx'

/**
 * The offer, the proof of it, and the two ways to act — in one viewport.
 *
 * This replaced a three-slide rotating banner. A carousel splits the strongest
 * argument across slides most visitors never advance to, and the one slide
 * they do see is chosen by a timer rather than by us; on a page whose only job
 * is to sell, that is a conversion tax paid for motion. One message, committed.
 *
 * The headline is a customer's own sentence, attributed on the line beneath
 * it. That matters: "cut your bill by 80%" is a claim we would have to defend,
 * while a quoted review is a fact about what somebody said. The saving is the
 * strongest thing this company owns and it costs nothing to say honestly.
 */
export default function Hero() {
  const phone = COMPANY.phones[0]

  return (
    <section id="top" className="relative isolate overflow-hidden">
      {/* The array itself, not a gradient. A solar company whose front page
          shows no solar is selling from a brochure it has not opened. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <img src="/hero-array.jpg" alt="" className="h-full w-full object-cover object-center" />
        {/* The scrim is directional, not flat. A flat wash dark enough for the
            headline turns the array into a grey rectangle — which is the same
            as having shipped no photograph. Instead the left is opaque where
            the text sits and opens toward the right, so the panels are still a
            photograph in the half nothing is set over. Below lg the text runs
            the full width, so that half closes back up. */}
        <div className="absolute inset-0 bg-gradient-to-r from-pit via-pit/85 to-pit/45 lg:via-pit/80 lg:to-pit/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-pit/75 via-transparent to-pit/85" />
      </div>

      <div className="rail pt-nav">
        <div className="rail-inner pt-16 pb-14 lg:pt-24 lg:pb-20">
          <p className="text-glint-soft max-w-measure text-sm leading-relaxed sm:text-base">
            Solar for homes and businesses across Leyte, Southern Leyte and Cebu.
          </p>

          <h1 className="display-wide text-glint mt-6 max-w-[16ch] text-[clamp(2.75rem,7.5vw,5.25rem)] leading-[0.95] font-semibold text-balance">
            My bill was ₱10,000.
            <br />
            <span className="text-hot-400">Now I pay ₱2,000.</span>
          </h1>

          <p className="text-glint-soft mt-6 text-sm">
            — a customer, in their own review. One of the reasons we are recommended by{' '}
            <span className="text-glint font-medium">100% of them</span>.
          </p>

          <p className="text-glint-soft max-w-measure mt-8 leading-relaxed">
            Designed, supplied and installed under a duly licensed electrical engineer, to DOE and ERC standards —
            from a single 6 kW roof to megawatt-scale plant. Tell us what your bill looks like and we will tell you
            what it could look like instead.
          </p>

          {/* Two actions, ranked. The phone is not a footer detail on a site
              whose prices are settled by phone — it is the second half of the
              primary action. */}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button as="a" href="/#footer" size="lg">
              Get a free quote
              <ArrowUpRightIcon className="h-4 w-4" />
            </Button>

            <a
              href={`tel:${phone.replace(/\s/g, '')}`}
              className="group/call border-glint-soft/40 hover:border-glint hover:bg-glint/[0.06] flex h-12 items-center gap-3 rounded-full border px-6 transition-colors duration-200"
            >
              <PhoneIcon className="text-hot-400 h-4 w-4 shrink-0" />
              <span className="text-glint font-mono text-sm font-medium tracking-tight">{phone}</span>
            </a>
          </div>

          {/* The four published figures, on the photograph rather than in a
              band of their own below it. Someone who reads only the first
              screen still leaves knowing the company is real. */}
          <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-[1.25rem] border border-glint/15 bg-glint/10 backdrop-blur-md lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-pit/55 px-5 py-5">
                <dt className="text-glint-soft text-xs font-medium">{s.label}</dt>
                <dd className="display-wide text-glint mt-1.5 text-2xl font-semibold tabular-nums">{s.figure}</dd>
                <p className="text-glint-soft mt-2 text-xs leading-relaxed">{s.note}</p>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
