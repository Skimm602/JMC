/**
 * Two words, one of them boxed. The chip carries the brand name and the plain
 * word carries the category, so the lockup reads at a glance even at the size
 * a header gives it — and the filled chip is the brightest object in the bar,
 * which is what stops the identity dissolving into the row of links.
 */
export default function Logo({ className = '', compact = false, tone = 'ink' }) {
  const onShade = tone === 'shade'

  return (
    /* The name is labelled on the link rather than left to the two spans, so
       `compact` cannot silently shorten it to "VIP" for a screen reader. */
    <a href="#top" aria-label="VIP Solar — home" className={`group inline-flex items-baseline gap-2 ${className}`}>
      <span
        className={`font-display display-wide rounded-[0.5rem] px-2.5 py-1 text-[1.0625rem] leading-none font-bold tracking-[0.02em] transition-colors duration-200 ${
          onShade ? 'bg-glint text-pit group-hover:bg-glare' : 'bg-ink text-glare group-hover:bg-pit'
        }`}
      >
        VIP
      </span>

      {!compact && (
        <span
          className={`font-display display-wide text-[1.0625rem] leading-none font-bold tracking-[0.02em] ${
            onShade ? 'text-glint' : 'text-ink'
          }`}
        >
          Solar
        </span>
      )}
    </a>
  )
}
