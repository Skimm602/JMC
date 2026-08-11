import { ArrowUpRightIcon } from './icons.jsx'
import { Button } from './ui.jsx'

export default function Hero() {
  return (
    /* The hero is the photograph, not a panel laid on top of one. The dark
       ground the header bar is the top edge of is now the scrim over that
       photograph, so the bar, the band and the image read as one surface and
       the content is set directly into it. */
    <section id="top" className="band-pit rail relative isolate pt-nav">
      {/* The ground is a photograph of the thing being sold. It is held down,
          but only where something has to be read on top of it — a flat scrim
          heavy enough for the worst pixel in the frame would take the sunset
          with it, so the weight is placed instead of spread:

            left    the argument column sits here, and the section spine is
                    fixed over this rail with glint-soft labels, which need a
                    ground at or below ~0.07 luminance. Solid pit, no argument.
            top     the bar's own dark has to continue into the band rather
                    than ending on a bright sky.
            bottom  hands off to the sheet band below without a seam.

          What is left — the middle and right of the frame — is where the
          photograph shows, and the only thing set over it there carries its
          own surface. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        <img
          src="/hero-array.jpg"
          alt=""
          fetchPriority="high"
          className="h-full w-full object-cover object-center brightness-105 saturate-110"
        />
        <div className="bg-pit/55 absolute inset-0" />
        <div className="from-pit via-pit/70 absolute inset-0 bg-gradient-to-r via-42% to-transparent to-72%" />
        {/* Bands rather than one full-height gradient: a gradient that runs the
            whole height has to be fading somewhere at every row, and the middle
            is the one place the photograph is supposed to be left alone. */}
        <div className="from-pit absolute inset-x-0 top-0 h-28 bg-gradient-to-b to-transparent" />
        <div className="from-pit absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t to-transparent" />
      </div>

      <div className="rail-inner pt-14 pb-16 lg:pt-20 lg:pb-24 xl:pt-24 xl:pb-28">
        <div className="grid items-start gap-14 xl:grid-cols-[minmax(0,6.2fr)_minmax(0,5.8fr)] xl:gap-16">
          {/* ---------------------------- argument ---------------------------- */}
          <div>
            {/* An outlined pill rather than the hairline-and-label pairing the
                rest of the page uses: this is the one eyebrow that has to hold
                its own against a headline four times its size. */}
            <p className="label border-glint-soft/45 text-glint-soft inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 font-medium">
              <span aria-hidden="true" className="bg-cool-400 h-1.5 w-1.5 shrink-0 rounded-full" />
              H6 hybrid series — shipping now
            </p>

            <h1 className="display-wide text-display-1 text-glint mt-7 font-semibold text-balance">
              Rated output at 45 °C.
              <br />
              {/* hot-400 rather than the 600 this line carried on the lit panel:
                  the warm pole has to be read against pit here, not sheet */}
              <span className="text-hot-400">Not at 25.</span>
            </h1>

            <p className="text-glint max-w-measure mt-7 text-lg leading-snug font-medium">
              Datasheets are written at 25 °C ambient. Philippine roofs are not.
            </p>

            <p className="text-glint-soft max-w-measure mt-5 text-[0.9375rem] leading-relaxed">
              Grid-tie, hybrid and storage inverters engineered around the two things installers actually get called
              back for: thermal headroom and clean commissioning.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button as="a" href="#products" variant="outlineShade" size="lg">
                Compare the range
              </Button>
            </div>
          </div>

          {/* ------------------------------ the line -------------------------- */}
          {/* Set on its own translucent surface rather than straight onto the
              photograph: the frame is bright and uneven in the middle, and a
              line this size has to hold at 3:1 wherever the sun happens to sit
              in the crop. The blur keeps the image reading through it, which is
              the point of putting it here rather than on a solid card. */}
          <blockquote className="border-glint-soft/25 bg-pit/45 rounded-[1.75rem] border p-8 backdrop-blur-md sm:p-10 xl:mt-6">
            <p className="label text-glint-soft flex items-center gap-3 font-medium">
              <span aria-hidden="true" className="bg-hot-400 h-px w-6 shrink-0" />
              Field note
            </p>

            <p className="display-wide text-display-3 text-glint mt-6 font-semibold text-balance">
              A datasheet is a promise made in an air-conditioned lab.
            </p>

            <p className="display-wide text-display-3 text-hot-400 mt-3 font-semibold text-balance">
              The roof is where it gets collected.
            </p>

            <footer className="border-rule-shade text-glint-soft mt-8 border-t pt-6 text-[0.9375rem] leading-relaxed">
              Cebu roofs run a 34 °C mean maximum at two in the afternoon. Everything we ship is specified to still be
              at 100 % there.
            </footer>
          </blockquote>
        </div>

        {/* The primary action carries the brightest warm in the palette with
            dark text on top — the one inversion on the page, and the reason the
            eye lands here before anywhere else. */}
        <div className="mt-14 inline-flex w-full sm:w-auto">
          <a
            href="#register"
            className="group/join bg-hot-400 hover:bg-hot-500 flex w-full items-center justify-between gap-6 rounded-[1.75rem] px-7 py-6 transition-colors duration-200 sm:w-auto sm:min-w-[26rem] sm:px-9"
          >
            <span className="text-pit text-lg font-semibold">Become a certified installer</span>
            <span className="border-pit/35 group-hover/join:border-pit group-hover/join:bg-pit/10 grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors duration-200">
              <ArrowUpRightIcon className="text-pit h-5 w-5" strokeWidth={1.9} />
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}
