import { COMPANY, STATS } from '@/utils/company'
import { ArrowUpRightIcon, PhoneIcon } from './icons.jsx'

/**
 * A split, not a band.
 *
 * Every other section on this site is the same shape: a centred rail, heading
 * left, supporting text right, repeated down the page. That rhythm is what
 * makes a site read as "the same form" no matter how the copy changes, so the
 * page that has to sell hardest breaks it — edge to edge, two halves, no rail,
 * the offer on a field of colour against the photograph rather than floating
 * over it.
 *
 * The colour is committed rather than accented: the left half is a solid field
 * carrying roughly half the viewport. An orange that only ever appears as a
 * 4px underline is a decoration; an orange you cannot look away from is the
 * argument that this company is not another blue utility supplier.
 *
 * The headline is a customer's own sentence, attributed underneath. "Cut your
 * bill by 80%" would be a claim to defend; a quoted review is a fact about
 * what somebody actually said, and it is the strongest sentence this company
 * owns.
 */
export default function Hero() {
  const phone = COMPANY.phones[0]

  return (
    <section id="top" className="pt-nav">
      <div className="grid lg:min-h-[calc(100svh-var(--spacing-nav))] lg:grid-cols-[1.05fr_1fr]">
        {/* ------------------------------- the offer ------------------------------ */}
        <div className="bg-hot-600 relative flex flex-col justify-center px-6 py-14 sm:px-10 lg:py-20 lg:pr-16 lg:pl-[max(2.5rem,calc((100vw-74rem)/2+2.5rem))]">
          <p className="text-glare/75 text-sm leading-relaxed sm:text-base">
            Solar for homes and businesses across Leyte, Southern Leyte and Cebu.
          </p>

          <h1 className="display-wide text-glare mt-6 text-[clamp(2.5rem,5.2vw,4.25rem)] leading-[0.94] font-semibold text-balance">
            My bill was ₱10,000.
            <br />
            Now I pay ₱2,000.
          </h1>

          <p className="text-glare/75 mt-6 text-sm leading-relaxed">
            — a customer, in their own review. One of the reasons{' '}
            <span className="text-glare font-medium">100% of them recommend us</span>.
          </p>

          <p className="text-glare/85 mt-8 max-w-[46ch] leading-relaxed">
            Designed, supplied and installed under a duly licensed electrical engineer, to DOE and ERC standards —
            from a single 6 kW roof to megawatt-scale plant. Tell us what your bill looks like and we will tell you
            what it could look like instead.
          </p>

          {/* Inverted against the field: on a saturated ground the loudest
              possible button is the one that is not coloured at all. */}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="/#footer"
              className="group/cta bg-glare text-hot-700 hover:bg-glare/90 inline-flex h-13 items-center justify-center gap-2.5 rounded-full px-7 text-[0.9375rem] font-semibold transition-colors duration-200"
            >
              Get a free quote
              <ArrowUpRightIcon className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
            </a>

            <a
              href={`tel:${phone.replace(/\s/g, '')}`}
              className="text-glare border-glare/45 hover:bg-glare/10 hover:border-glare inline-flex h-13 items-center justify-center gap-2.5 rounded-full border px-6 font-mono text-sm font-medium transition-colors duration-200"
            >
              <PhoneIcon className="h-4 w-4 shrink-0" />
              {phone}
            </a>
          </div>
        </div>

        {/* ------------------------------ the evidence ---------------------------- */}
        <div className="relative min-h-[22rem] lg:min-h-0">
          <img
            src="/hero-array.jpg"
            alt="A commissioned rooftop array in daylight."
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Only enough wash to seat the figures at the foot of the frame —
              the photograph is doing work here, not decorating. */}
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-pit to-transparent" />

          <dl className="absolute inset-x-0 bottom-0 grid grid-cols-2 gap-x-6 gap-y-5 p-6 sm:p-8">
            {STATS.map((s) => (
              <div key={s.label}>
                <dd className="display-wide text-glare text-2xl leading-none font-semibold tabular-nums sm:text-[1.75rem]">
                  {s.figure}
                </dd>
                <dt className="text-glare/70 mt-1.5 text-xs font-medium">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
