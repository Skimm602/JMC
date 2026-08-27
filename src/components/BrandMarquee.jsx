import { cx } from './ui.jsx'

/**
 * Two rows scrolling in opposite directions, the way the parent company's own
 * site shows its dealership — logos rather than a wall of seventeen names, so
 * a shopper recognises a brand mark instead of having to read for it.
 *
 * No 'use client': the animation is pure CSS (`animate-marquee-left/right` in
 * globals.css), so the row needs no JavaScript to move — only to exist.
 *
 * Each row's content is duplicated once. `animate-marquee-left` moves the
 * track exactly one copy's width (`translateX(-50%)`), which is what makes
 * the loop seamless — the second copy is already sitting where the first
 * would have repeated.
 */
function Row({ brands, direction }) {
  const track = [...brands, ...brands]

  return (
    <div
      className={cx(
        'flex w-max gap-4 hover:[animation-play-state:paused]',
        direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right',
      )}
    >
      {track.map((brand, i) => (
        <div
          key={`${brand.name}-${i}`}
          className={cx(
            'border-rule bg-glare rounded-card flex h-16 w-40 shrink-0 items-center justify-center border p-4 grayscale transition-[filter] duration-300 hover:grayscale-0',
            // The two brands stocked as boxed equipment on this site keep a
            // faint amber ring — the same "drawn forward" treatment the text
            // chips used to carry with border-solar-600.
            brand.emphasized && 'ring-solar-500/40 ring-1',
          )}
        >
          <img src={brand.logo} alt={brand.name} title={brand.name} className="max-h-9 w-full object-contain" loading="lazy" />
        </div>
      ))}
    </div>
  )
}

export default function BrandMarquee({ brands }) {
  const half = Math.ceil(brands.length / 2)
  const rowA = brands.slice(0, half)
  const rowB = brands.slice(half)

  return (
    <div
      // Full-bleed rather than boxed to the rail: a marquee that stops short
      // of the viewport edge reads as a carousel that ran out of room, not
      // one that keeps going off-screen.
      className="relative left-1/2 mt-8 w-screen -translate-x-1/2 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
    >
      <div className="flex flex-col gap-4 py-1">
        <Row brands={rowA} direction="left" />
        <Row brands={rowB} direction="right" />
      </div>
    </div>
  )
}
