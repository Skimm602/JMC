/**
 * The mark is the derating curve in miniature — flat, then falling away.
 * It is the same idea the hero figure argues at full size, so the identity
 * and the product claim are the same shape.
 */
export default function Logo({ className = '', compact = false, tone = 'ink' }) {
  const onShade = tone === 'shade'

  return (
    <a href="#top" className={`group inline-flex items-center gap-3 ${className}`}>
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center border transition-colors duration-200 ${
          onShade
            ? 'border-rule-shade group-hover:border-glint-soft'
            : 'border-rule-strong group-hover:border-ink'
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M3 7.5h9.5L21 17"
            className={
              onShade
                ? 'stroke-glint transition-colors'
                : 'stroke-ink transition-colors'
            }
            strokeWidth="2.1"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>
      </span>

      {!compact && (
        <span className="leading-none">
          <span
            className={`font-display display-wide block text-[1.0625rem] font-bold tracking-[0.04em] ${
              onShade ? 'text-glint' : 'text-ink'
            }`}
          >
            VIP
          </span>
          <span
            className={`mt-1 block font-mono text-[9px] tracking-[0.3em] uppercase ${
              onShade ? 'text-glint-soft' : 'text-ink-soft'
            }`}
          >
            Solar
          </span>
        </span>
      )}
      <span className="sr-only">VIP Solar — home</span>
    </a>
  )
}
