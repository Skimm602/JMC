import { COMPANY, STATS } from '@/utils/company'
import { ArrowUpRightIcon, PhoneIcon } from './icons.jsx'
import Reveal from './Reveal.jsx'

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
 * carrying roughly half the viewport — navy, matching the field the parent
 * company's own site is built on, with the amber signal colour reserved for
 * the one thing that should pull the eye: the button.
 *
 * The headline is a customer's own sentence, attributed underneath. "Cut your
 * bill by 80%" would be a claim to defend; a quoted review is a fact about
 * what somebody actually said, and it is the strongest sentence this company
 * owns.
 */
export default function Hero() {
  const phone = COMPANY.phones[0]

  return (
    // No `pt-nav` here any more: that padding used to push the whole grid
    // down, which meant the navy panel and the photo both started *below*
    // the transparent header rather than under it — so a transparent nav
    // was uncovering plain page background, not the hero. The clearance
    // moves onto the two panels themselves instead, as padding on their own
    // content rather than a gap before their background begins.
    <section id="top">
      <div className="grid lg:min-h-[100svh] lg:grid-cols-[1.05fr_1fr]">
        {/* ------------------------------- the offer ------------------------------ */}
        {/* No overflow-hidden on this box itself — the panel's height is
            stretched to the grid row by the browser, and on a short viewport
            four stacked paragraphs can genuinely run taller than that. Clip
            the panel and that overflow is cut off outright; leaving it
            visible just lets the last line spill a few px into the padding,
            which is the far smaller cost. The glow layer below carries its
            own clip instead, so the decoration still can't bleed past the
            column. */}
        <div className="bg-gradient-to-br from-navy-900 to-navy-950 relative flex flex-col justify-center px-6 pt-nav pb-12 sm:px-10 lg:pb-10 lg:pr-16 lg:pl-[max(2.5rem,calc((100vw-74rem)/2+2.5rem))]">
          {/* Ambient glow, not scenery — two blurred fields drifting at
              different speeds so they never lock into a visible cycle,
              `-z-10` so they sit under every real element without needing
              the content itself to opt into a stacking context. Clipped to
              this layer alone, not the panel — see the note above. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="bg-solar-500/20 animate-float-slow animate-pulse-glow absolute -top-16 right-[-4rem] h-72 w-72 rounded-full blur-3xl" />
            <div className="bg-cool-400/10 animate-float-slower absolute bottom-[-5rem] left-[-3rem] h-80 w-80 rounded-full blur-3xl" />
          </div>

          {/* Staggered rather than one block fading in together — the same
              cascade the parent company's own hero runs on load, each line
              landing a beat after the one above it. */}
          <Reveal as="p" delay={0} className="text-glare/75 text-sm leading-relaxed sm:text-base">
            Solar for homes and businesses across Leyte, Southern Leyte and Cebu.
          </Reveal>

          <Reveal
            as="h1"
            delay={90}
            className="font-display-jmc text-glare mt-5 text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[0.96] font-bold text-balance"
          >
            My bill was ₱10,000.
            <br />
            Now I pay ₱2,000.
          </Reveal>

          <Reveal as="p" delay={180} className="text-glare/75 mt-5 text-sm leading-relaxed">
            — a customer, in their own review. One of the reasons{' '}
            <span className="text-glare font-medium">100% of them recommend us</span>.
          </Reveal>

          <Reveal as="p" delay={270} className="text-glare/85 mt-5 max-w-[46ch] leading-relaxed">
            Designed, supplied and installed under a duly licensed electrical engineer, to DOE and ERC standards —
            from a single 6 kW roof to megawatt-scale plant. Tell us what your bill looks like and we will tell you
            what it could look like instead.
          </Reveal>

          {/* Inverted against the field: on a saturated ground the loudest
              possible button is the one that is not coloured at all. */}
          <Reveal as="div" delay={360} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="/#footer"
              className="group/cta bg-solar-500 text-navy-950 hover:bg-solar-400 inline-flex h-13 items-center justify-center gap-2.5 rounded-full px-7 text-[0.9375rem] font-semibold shadow-[0_0_0_0_rgba(245,158,11,0.5)] transition-[background-color,box-shadow] duration-300 hover:shadow-[0_0_24px_2px_rgba(245,158,11,0.5)]"
            >
              Get a free quote
              <ArrowUpRightIcon className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
            </a>

            <a
              href={`tel:${phone.replace(/\s/g, '')}`}
              className="text-glare border-glare/45 hover:bg-glare/10 hover:border-solar-400 inline-flex h-13 items-center justify-center gap-2.5 rounded-full border px-6 font-mono text-sm font-medium transition-colors duration-200"
            >
              <PhoneIcon className="h-4 w-4 shrink-0" />
              {phone}
            </a>
          </Reveal>
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
          {/* A second, shallow wash at the top — not for the photo, for the
              bar sitting transparent over it. Without this the cart icon and
              account menu, which fall on this side of the split at `lg`,
              would land on bare daylight roof rather than on the dark ground
              the rest of the transparent header reads against. */}
          <div aria-hidden="true" className="from-pit/70 absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent" />

          <dl className="absolute inset-x-0 bottom-0 grid grid-cols-2 gap-x-6 gap-y-5 p-6 sm:p-8">
            {STATS.map((s, i) => (
              <Reveal as="div" key={s.label} delay={200 + i * 90}>
                <dd className="font-display-jmc text-glare text-2xl leading-none font-bold tabular-nums sm:text-[1.75rem]">
                  {s.figure}
                </dd>
                <dt className="text-glare/70 mt-1.5 text-xs font-medium">{s.label}</dt>
              </Reveal>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
