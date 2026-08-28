import { ADDRESS_LINE, COMPANY, CREDENTIALS, SERVICE_AREAS, STORY } from '@/utils/company'
import { Eyebrow } from './ui.jsx'
import { ArrowRightIcon, CheckIcon, PhoneIcon } from './icons.jsx'
import Reveal from './Reveal.jsx'

/**
 * The one dark thing on the page.
 *
 * Everything else is a white or sky tile on the field, and a page made only
 * of those reads as unfinished no matter how well the tiles are arranged.
 * This is a single navy slab at the full width of the rail, holding the
 * company's own account of itself, the three credentials that decide whether
 * a roof job is legal at all, and the photograph — so the contrast lands
 * once, in the place where the longest reading happens.
 *
 * Every fact is read from `company.js`. Nothing here is written in JSX.
 */
export default function About() {
  const phone = COMPANY.phones[0]

  return (
    <section id="about" className="rail py-6 lg:py-10">
      <div className="rail-inner">
        <Reveal className="tile-navy relative overflow-hidden">
          {/* Ambient warmth, so the slab is a lit interior rather than a
              rectangle of paint. Clipped by the slab's own overflow. */}
          <div
            aria-hidden="true"
            className="bg-solar-500/15 pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full blur-3xl"
          />
          <div
            aria-hidden="true"
            className="bg-cool-400/10 pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full blur-3xl"
          />

          <div className="relative grid gap-10 p-7 sm:p-10 lg:grid-cols-12 lg:gap-12 lg:p-14">
            <div className="lg:col-span-7">
              <Eyebrow tone="shade">About us</Eyebrow>

              <h2 className="text-glare mt-6 text-[clamp(1.9rem,3.4vw,3rem)] leading-[1.02] font-bold text-balance">
                Built by the people <span className="text-sky-400">who climb the roof.</span>
              </h2>

              <div className="mt-7 grid max-w-[52ch] gap-5">
                {STORY.map((paragraph, i) => (
                  <p key={i} className="text-glint-soft leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* The three things that decide whether a roof job is legal and
                  insurable — a different question from whether the equipment
                  is any good, and the one a homeowner does not know to ask. */}
              {/* Three across only where there is genuinely room for three
                  columns of prose. Between lg and xl the slab's left half is
                  ~640px, which is three 195px columns of ragged four-word
                  lines — so it stacks there instead. */}
              <ul className="mt-9 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {CREDENTIALS.map((c) => (
                  <li key={c.title} className="rounded-card border border-white/10 bg-white/[0.04] p-5">
                    <CheckIcon className="text-solar-400 h-5 w-5" />
                    <p className="text-glare mt-3 text-sm font-semibold">{c.title}</p>
                    <p className="text-glint-soft mt-2 text-xs leading-relaxed">{c.body}</p>
                  </li>
                ))}
              </ul>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="/#footer"
                  className="group/cta bg-solar-500 text-navy-950 hover:bg-solar-400 inline-flex h-13 items-center gap-3 rounded-full pr-2 pl-7 text-[0.9375rem] font-semibold transition-colors duration-200"
                >
                  Get a free quote
                  <span className="bg-navy-950 text-solar-400 grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform duration-200 group-hover/cta:translate-x-0.5">
                    <ArrowRightIcon className="h-4 w-4" />
                  </span>
                </a>
                <a
                  href={`tel:${phone.replace(/\s/g, '')}`}
                  className="text-glare hover:border-glare/60 inline-flex h-13 items-center justify-center gap-2.5 rounded-full border border-white/25 px-6 font-mono text-sm font-medium transition-colors duration-200"
                >
                  <PhoneIcon className="text-solar-400 h-4 w-4 shrink-0" />
                  {phone}
                </a>
              </div>
            </div>

            {/* The photograph, plus the answer to the question a visitor asks
                immediately after reading any of the above: do you come here. */}
            <div className="lg:col-span-5">
              <figure className="tile-photo">
                <img
                  src="/projects/education-100kw.webp"
                  alt="A 100 kW on-grid installation across the roofs of an educational institution."
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover lg:aspect-[418/560]"
                />
              </figure>

              <div className="rounded-card mt-5 border border-white/10 bg-white/[0.04] p-6">
                <p className="label text-glint-soft">Where the crews travel</p>
                <ul className="mt-4 grid gap-3.5">
                  {SERVICE_AREAS.map((area) => (
                    <li key={area.province}>
                      <p className="text-glare text-sm font-semibold">{area.province}</p>
                      <p className="text-glint-soft mt-1 text-xs leading-relaxed">{area.places.join(' · ')}</p>
                    </li>
                  ))}
                </ul>
                <p className="text-glint-soft/80 mt-5 border-t border-white/10 pt-4 text-xs leading-relaxed">
                  {ADDRESS_LINE}
                  <br />
                  {COMPANY.hours}
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
