import DeratingCurve from './DeratingCurve.jsx'
import { Button } from './ui.jsx'

/** Reads as the legend of a datasheet figure, because that is what it is. */
const LEGEND = [
  {
    key: 'vip',
    mark: 'h-[3px] w-6 bg-cool-600',
    term: 'VIP H6',
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
    <section id="top" className="band-sheet rail relative pt-nav">
      {/* The two-column split waits for xl. Between lg and xl the figure was
          squeezed into a 7fr column barely 480px wide, which is what drove
          the chart's own type down to eight pixels; stacked, it gets the full
          measure and the curve is readable at every width in between. */}
      <div className="rail-inner pt-16 pb-20 lg:pt-24 lg:pb-28 xl:pt-32 xl:pb-36">
        <div className="grid items-start gap-14 xl:grid-cols-[minmax(0,4.6fr)_minmax(0,7.4fr)] xl:gap-16">
          {/* ------------------------------ argument ----------------------------- */}
          <div className="xl:pt-6">
            <p className="label text-ink-soft flex items-center gap-3 font-medium">
              <span aria-hidden="true" className="bg-cool-600 h-px w-6 shrink-0" />
              H6 hybrid series — shipping now
            </p>

            <h1 className="display-wide text-display-1 mt-7 font-semibold text-balance">
              Rated output at 45 °C.
              <br />
              <span className="text-hot-600">Not at 25.</span>
            </h1>

            <p className="text-ink max-w-measure mt-7 text-lg leading-snug font-medium">
              Datasheets are written at 25 °C ambient. Philippine roofs are not.
            </p>

            <p className="text-ink-soft max-w-measure mt-5 text-[0.9375rem] leading-relaxed">
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
          <figure className="border-rule bg-glare corner-ticks text-ink border">
            {/* title block, the way a drawing carries its conditions */}
            <div className="border-rule label text-ink-soft flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b px-5 py-3">
              <span className="text-ink font-medium">Fig. 1 — Output vs. ambient</span>
              <span>1000 W/m² · DC/AC 1.2 · rev 4.8.2</span>
            </div>

            <div className="px-3 pt-6 pb-2 sm:px-5">
              <DeratingCurve className="h-auto w-full" />
            </div>

            <figcaption className="border-rule border-t px-5 py-5">
              <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {LEGEND.map((l) => (
                  <div key={l.key} className="flex items-baseline gap-3">
                    <span aria-hidden="true" className={`mt-2 shrink-0 ${l.mark}`} />
                    <div className="min-w-0">
                      <dt className="label text-ink">{l.term}</dt>
                      <dd className="text-ink-soft mt-0.5 text-[0.8125rem] leading-snug">{l.detail}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}
