import DeratingCurve from './DeratingCurve.jsx'
import { Button } from './ui.jsx'

/** Reads as the legend of a datasheet figure, because that is what it is. */
const LEGEND = [
  {
    key: 'jmc',
    mark: 'h-[3px] w-6 bg-cool-600',
    term: 'JMC H6',
    detail: '100 % to 45 °C, 78 % at 60 °C',
  },
  {
    key: 'class',
    mark: 'h-[2px] w-6 bg-hot-500',
    term: 'Class average',
    detail: 'derates from 35 °C, 55 % at 60 °C',
  },
  {
    key: 'design',
    mark: 'h-0 w-6 border-t-2 border-dashed border-hot-600',
    term: 'Cebu, 14:00',
    detail: '34 °C mean max — inside the flat region',
  },
]

export default function Hero() {
  return (
    <section id="top" className="band-glare relative pt-[68px]">
      <div className="px-5 pt-16 pb-20 sm:px-8 lg:pt-24 lg:pb-28 lg:pr-10 lg:pl-[128px]">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            {/* ------------------------------ argument ----------------------------- */}
            <div className="lg:pt-6">
              <p className="text-ink-soft flex items-center gap-3 font-mono text-[11px] font-medium tracking-[0.24em] uppercase">
                <span aria-hidden="true" className="bg-hot-600 h-px w-6" />
                H6 hybrid series — shipping now
              </p>

              <h1 className="display-wide mt-7 text-[clamp(2.25rem,4.4vw,3.4rem)] leading-[0.95] font-semibold tracking-[-0.02em]">
                Rated output at 45 °C.
                <br />
                <span className="text-hot-600">Not at 25.</span>
              </h1>

              <p className="text-ink mt-7 max-w-md text-lg leading-snug font-medium">
                Datasheets are written at 25 °C ambient. Philippine roofs are not.
              </p>

              <p className="text-ink-soft mt-5 max-w-md text-[0.9375rem] leading-relaxed">
                Grid-tie, hybrid and storage inverters engineered around the two things installers actually get
                called back for: thermal headroom and clean commissioning.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Button as="a" href="#register" size="lg">
                  Become a certified installer
                </Button>
                <Button as="a" href="#products" variant="outline" size="lg">
                  Compare the range
                </Button>
              </div>
            </div>

            {/* -------------------------- the figure itself ------------------------ */}
            <figure className="border-ink/15 bg-sheet corner-ticks text-ink border">
              {/* title block, the way a drawing carries its conditions */}
              <div className="border-ink/15 text-ink-soft flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b px-5 py-3 font-mono text-[11px] tracking-[0.12em] uppercase">
                <span className="text-ink font-medium">Fig. 1 — Output vs. ambient</span>
                <span>1000 W/m² · DC/AC 1.2 · rev 4.8.2</span>
              </div>

              <div className="px-3 pt-6 pb-2 sm:px-5">
                <DeratingCurve className="h-auto w-full" />
              </div>

              <figcaption className="border-ink/15 border-t px-5 py-5">
                <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {LEGEND.map((l) => (
                    <div key={l.key} className="flex items-baseline gap-3">
                      <span aria-hidden="true" className={`mt-2 shrink-0 ${l.mark}`} />
                      <div className="min-w-0">
                        <dt className="text-ink font-mono text-[11px] tracking-[0.12em] uppercase">{l.term}</dt>
                        <dd className="text-ink-soft mt-0.5 text-[0.8125rem] leading-snug">{l.detail}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  )
}
