/**
 * The first thing a visitor sees, and only the first time.
 *
 * A solar module is a grid of cells, so the opening is one: light reaches the
 * array a cell at a time, sweeping diagonally across it, and the wordmark
 * settles underneath once the panel is lit. About two seconds — long enough
 * to read as a deliberate thing rather than a flicker, short enough that
 * nobody waits through it twice.
 *
 * The wave is not animated as a wave. Every cell runs the identical keyframe
 * (.intro-cell in globals.css) and the travelling highlight comes entirely
 * from each one's delay, set below from its position in the grid. That keeps
 * it a single 0.55s animation forty times over rather than one long timeline
 * to keep in step.
 *
 * A server component with no client boundary. The animation is entirely CSS
 * and clears itself with or without JavaScript; the inline script does one
 * thing only, which is remember that the greeting already happened.
 *
 * Mounted in the (site) layout rather than the root, so the back office does
 * not open with a splash screen — somebody working through an order queue is
 * not a visitor arriving.
 */

/** Landscape, in roughly the proportion of a real module. Enough cells to
    read as a panel; few enough that the wave stays legible rather than
    dissolving into noise. */
const COLUMNS = 8
const ROWS = 5

/** Seconds added per step along the diagonal. The far corner is (COLUMNS-1 +
    ROWS-1) steps out, so the sweep takes 11 × this to cross the panel. */
const STEP = 0.045

const CELLS = Array.from({ length: COLUMNS * ROWS }, (_, i) => {
  const row = Math.floor(i / COLUMNS)
  const column = i % COLUMNS
  // Row plus column, so the delay is equal along each anti-diagonal and the
  // light arrives as a slanted front rather than a straight edge.
  return { key: i, delay: (row + column) * STEP }
})

export default function IntroScreen() {
  return (
    <>
      {/*
        Parser-blocking and placed above the markup on purpose: it runs before
        the cover below is parsed, so a repeat visit never paints a frame of
        it. Doing this in an effect instead would show the cover and then snatch
        it away, which is worse than not having one.

        Wrapped in try/catch because sessionStorage throws rather than returning
        null in a browser with storage blocked — and an intro animation is not
        worth taking the page down for.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{if(sessionStorage.getItem('vip-intro'))document.documentElement.dataset.introSeen='1';else sessionStorage.setItem('vip-intro','1')}catch(e){}",
        }}
      />

      {/* aria-hidden: it says nothing the header does not already say, and a
          screen reader announcing the brand name twice on arrival is noise.
          pointer-events-none is load-bearing rather than tidy — see globals.css. */}
      <div
        aria-hidden="true"
        className="intro-screen band-pit pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8"
      >
        {/* The module. A hairline gap rather than a border on each cell: the
            pit showing through between them is what makes it read as cells
            laid on a frame instead of a drawn table. */}
        <div
          className="grid w-[min(22rem,68vw)] gap-[3px]"
          style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}
        >
          {CELLS.map(({ key, delay }) => (
            <span key={key} className="intro-cell aspect-square rounded-[1px]" style={{ animationDelay: `${delay}s` }} />
          ))}
        </div>

        <div className="intro-mark flex items-baseline gap-2.5">
          <span className="font-display display-wide bg-glint text-pit rounded-[0.5rem] px-3 py-1.5 text-[1.375rem] leading-none font-bold tracking-[0.02em]">
            VIP
          </span>
          <span className="font-display display-wide text-glint text-[1.375rem] leading-none font-bold tracking-[0.02em]">
            Solar
          </span>
        </div>
      </div>
    </>
  )
}
