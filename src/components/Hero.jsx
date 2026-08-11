import DeratingCurve from './DeratingCurve.jsx'
import { ArrowUpRightIcon } from './icons.jsx'
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
    /* The hero sits on the dark ground the header bar is the top edge of, and
       the content is inset into it as a lit panel. The frame is what makes the
       bar and the page read as one shape rather than a strip laid over a page
       that happens to start underneath it. */
    <section id="top" className="band-pit rail relative isolate pt-nav">
      {/* The ground is a photograph of the thing being sold, held down under a
          scrim so it stays ground rather than becoming the subject: the panel
          on top of it carries the argument and has to keep its contrast. The
          scrim is opaque enough that every text tone on this band measures the
          same as it did on flat pit, so nothing here depends on where the sun
          happens to fall in the frame. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        <img src="/hero-array.jpg" alt="" fetchPriority="high" className="h-full w-full object-cover object-center" />
        <div className="bg-pit/88 absolute inset-0" />
        {/* Deepens toward the fold so the band hands off to the sheet below it
            without a visible seam. */}
        <div className="from-pit/60 absolute inset-0 bg-gradient-to-b via-transparent to-[var(--color-pit)]" />
      </div>

      <div className="rail-inner pt-5 pb-16 lg:pt-7 lg:pb-20 xl:pt-9 xl:pb-24">
        {/* ------------------------------ lit panel ---------------------------- */}
        {/* The two-column split waits for xl. Between lg and xl the figure was
            squeezed into a 7fr column barely 480px wide, which is what drove
            the chart's own type down to eight pixels; stacked, it gets the full
            measure and the curve is readable at every width in between. */}
        <div className="band-sheet rounded-[1.75rem] rounded-bl-none px-6 py-14 sm:px-10 lg:px-12 lg:py-20 xl:px-16 xl:py-24">
          <div className="grid items-start gap-14 xl:grid-cols-[minmax(0,4.6fr)_minmax(0,7.4fr)] xl:gap-16">
            {/* ---------------------------- argument --------------------------- */}
            <div className="xl:pt-6">
              {/* An outlined pill rather than the hairline-and-label pairing the
                  rest of the page uses: this is the one eyebrow that has to hold
                  its own against a headline four times its size. */}
              <p className="label border-rule-strong text-ink-soft inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 font-medium">
                <span aria-hidden="true" className="bg-cool-600 h-1.5 w-1.5 shrink-0 rounded-full" />
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
                Grid-tie, hybrid and storage inverters engineered around the two things installers actually get called
                back for: thermal headroom and clean commissioning.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Button as="a" href="#products" variant="outline" size="lg">
                  Compare the range
                </Button>
              </div>
            </div>

            {/* ------------------------ the figure itself ----------------------- */}
            <figure className="border-rule bg-glare text-ink overflow-hidden rounded-[1.125rem] border">
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

        {/* The primary action hangs off the panel's bottom-left, flush against
            it, so the two read as one cut shape rather than a panel with a
            button parked underneath. The notch is what sells that: the panel's
            colour curves into the angle where the block leaves it.

            It carries the brightest warm in the palette with dark text on top
            — the one inversion on the page, and the reason the eye lands here
            before anywhere else. */}
        <div className="relative inline-flex w-full sm:w-auto">
          <a
            href="#register"
            className="group/join bg-hot-400 hover:bg-hot-500 flex w-full items-center justify-between gap-6 rounded-b-[1.75rem] rounded-tr-[1.75rem] px-7 py-6 transition-colors duration-200 sm:w-auto sm:min-w-[26rem] sm:px-9"
          >
            <span className="text-pit text-lg font-semibold">Become a certified installer</span>
            <span className="border-pit/35 group-hover/join:border-pit group-hover/join:bg-pit/10 grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors duration-200">
              <ArrowUpRightIcon className="text-pit h-5 w-5" strokeWidth={1.9} />
            </span>
          </a>

          {/* fills the angle above the block's top-right with the panel colour */}
          <span
            aria-hidden="true"
            className="notch notch-tl top-0 left-full"
            style={{ '--notch-color': 'var(--color-sheet)' }}
          />
        </div>
      </div>
    </section>
  )
}
