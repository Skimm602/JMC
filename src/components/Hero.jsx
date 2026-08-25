'use client'

import { useEffect, useState } from 'react'
import { categoryHref, categoryBySlug } from '@/utils/product-categories'
import { cx } from './ui.jsx'

const inverterCategory = categoryBySlug('inverters')
const batteryCategory = categoryBySlug('batteries')

/**
 * The banner itself rotates, the way Suntree's does — the environment photo
 * first, then one slide per category that actually has a photo to show
 * (Accessories drops out, same reasoning as the shop cards below it). Each
 * slide carries its own heading rather than one fixed argument sitting over
 * all three — `accent` is always a real, published figure (the rated-output
 * range and the parallel-capacity spec are both read off the spec tables in
 * `Products.jsx`), never an invented promotional number.
 *
 * A product shot is a cutout on a plain ground, not a scene, so it does not
 * belong in the full-bleed background layer at all — sized to fit there it
 * either shrinks to nothing or grows wide enough to land under the text.
 * It sits in its own grid column instead, next to the text rather than
 * behind it, which rules out the overlap by construction. Below `lg` there
 * is not room for both, so the column is dropped and the slide falls back
 * to the same flat pit ground the text always reads against.
 */
const SLIDES = [
  {
    key: 'array',
    kind: 'photo',
    src: '/hero-array.jpg',
    heading: 'VIP Solar',
    sub: 'Grid-tie, hybrid and storage inverters for residential and commercial solar — engineered for the people who have to service them.',
  },
  {
    key: 'inverter',
    kind: 'product',
    src: inverterCategory.photo,
    label: inverterCategory.label,
    href: categoryHref(inverterCategory),
    heading: 'Hybrid inverters',
    accent: '6 – 16 kW',
    sub: 'Low and high voltage, single-phase.',
  },
  {
    key: 'battery',
    kind: 'product',
    src: batteryCategory.photo,
    label: batteryCategory.label,
    href: categoryHref(batteryCategory),
    heading: 'LiFePO₄ storage',
    accent: 'Up to 240 kWh',
    sub: 'Wall, rack and cabinet — parallel on one bus.',
  },
]

export default function Hero() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 5000)
    return () => clearInterval(id)
  }, [paused])

  const slide = SLIDES[index]

  return (
    /* The hero is the photograph, not a panel laid on top of one — true of
       whichever slide is showing. The dark ground the header bar is the top
       edge of is now the scrim over it, so the bar, the band and the image
       read as one surface and the content is set directly into it. */
    <section
      id="top"
      className="band-pit rail relative isolate flex min-h-[92vh] flex-col justify-center pt-nav"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* The ground is held down, but only where something has to be read on
          top of it — a flat scrim heavy enough for the worst pixel in the
          frame would take the sunset with it, so the weight is placed
          instead of spread:

            left    the argument column sits here, and the section spine is
                    fixed over this rail with glint-soft labels, which need a
                    ground at or below ~0.07 luminance. Solid pit, no argument.
            top     the bar's own dark has to continue into the band rather
                    than ending on a bright sky.
            bottom  hands off to the sheet band below without a seam.

          What is left — the middle and right of the frame — is where each
          slide's own content shows, and the only thing set over it there
          carries its own surface. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        {SLIDES.filter((s) => s.kind === 'photo').map((s) => (
          <div
            key={s.key}
            className={cx(
              'absolute inset-0 transition-opacity duration-1000 ease-out',
              slide.key === s.key ? 'opacity-100' : 'opacity-0',
            )}
          >
            <img
              src={s.src}
              alt=""
              fetchPriority="high"
              className="h-full w-full object-cover object-center brightness-105 saturate-110"
            />
          </div>
        ))}
        <div className="bg-pit/55 absolute inset-0" />
        <div className="from-pit via-pit/70 absolute inset-0 bg-gradient-to-r via-42% to-transparent to-72%" />
        {/* Bands rather than one full-height gradient: a gradient that runs the
            whole height has to be fading somewhere at every row, and the middle
            is the one place each slide is supposed to be left alone. */}
        <div className="from-pit absolute inset-x-0 top-0 h-28 bg-gradient-to-b to-transparent" />
        <div className="from-pit absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t to-transparent" />
      </div>

      <div className="rail-inner pt-14 pb-16 lg:pt-20 lg:pb-24 xl:pt-24 xl:pb-28">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_30rem]">
          {/* ---------------------------- argument ---------------------------- */}
          {/* Swaps with the slide behind it rather than sitting fixed on top —
              a rotating banner showing one argument the whole time reads as a
              mistake, not a choice. `key={slide.key}` forces a clean remount
              so the swap never blends two slides' text mid-transition. */}
          <div key={slide.key} className="max-w-2xl">
            <h1 className="display-wide text-display-1 text-glint font-semibold text-balance">
              {slide.heading}
              {/* Not every slide has a figure to lead with — the brand slide
                  is a name and a sentence, not a spec. */}
              {slide.accent && (
                <>
                  <br />
                  {/* hot-400 rather than the 600 this line carried on the lit
                      panel: the warm pole has to be read against pit here, not
                      sheet */}
                  <span className="text-hot-400">{slide.accent}</span>
                </>
              )}
            </h1>

            <p className="text-glint max-w-measure mt-7 text-lg leading-snug font-medium">{slide.sub}</p>
          </div>

          {/* ------------------------------ the unit ------------------------------ */}
          {/* Its own grid column rather than a background layer — a column
              cannot be overlapped by the text next to it the way a floated
              background image can. Hidden below `lg`, where there is no room
              for both without one landing on the other.

              The box itself is unconditional and the same fixed height on
              every slide — including the brand slide, which has no unit to
              show — so the grid row never grows or shrinks as the slides
              rotate. Only what is inside it changes. */}
          <div className="hidden h-96 lg:flex lg:items-center lg:justify-center xl:h-[30rem]">
            {slide.kind === 'product' && (
              <img src={slide.src} alt="" className="h-full w-full object-contain" />
            )}
          </div>
        </div>

        {/* ------------------------------ slide controls ------------------------------ */}
        <div className="mt-12 flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2" role="tablist" aria-label="Hero slides">
            {SLIDES.map((s, i) => (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={s.kind === 'photo' ? 'Overview' : s.label}
                onClick={() => setIndex(i)}
                className={cx(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === index ? 'bg-hot-400 w-6' : 'bg-glint-soft/40 hover:bg-glint-soft w-1.5',
                )}
              />
            ))}
          </div>

          {/* Only the product slides get a link — the environment shot is
              scene-setting, not a category, and giving it one would send a
              visitor into a filter that matches nothing in particular. */}
          {slide.kind === 'product' && (
            <a
              href={slide.href}
              className="text-glint hover:text-hot-400 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
            >
              Shop {slide.label}
              <span aria-hidden="true">→</span>
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
