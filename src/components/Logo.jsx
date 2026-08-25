/**
 * The wordmark, set as text rather than shipped as an image.
 *
 * "Vip Solar" and a green full stop — the mark as the brand file draws it,
 * including the capitalisation, which is Vip rather than VIP. The green is
 * --color-brand, sampled from that file.
 *
 * Text rather than the PNG for three reasons that all matter in a header: it
 * stays sharp at any size and pixel density with nothing to export, it costs
 * no request and cannot arrive after the rest of the bar, and it re-colours
 * for the band it sits on. The supplied file is black artwork on white, which
 * would need a second inverted copy to survive the deep-blue header — and two
 * files that must agree is how a logo quietly drifts.
 *
 * The dot keeps its green on every band. It is the only green on the page,
 * which is what makes it read as the mark rather than as decoration.
 */
export default function Logo({ className = '', compact = false, tone = 'ink' }) {
  const onShade = tone === 'shade'

  return (
    /* The name is labelled on the link rather than left to the spans, so
       `compact` cannot silently shorten it to "Vip" for a screen reader, and
       the full stop is never read out as the end of a sentence. */
    <a
      href="/"
      aria-label="Vip Solar — home"
      className={`group inline-flex items-baseline transition-opacity duration-200 hover:opacity-85 ${className}`}
    >
      {/* Normal width, not the expanded display axis the headings use: the
          mark is drawn at a regular grotesque width, and stretching it to
          match the page's voice would make it a different logo. */}
      <span
        aria-hidden="true"
        className={`font-display text-[1.75rem] leading-none font-bold tracking-[-0.02em] ${
          onShade ? 'text-glint' : 'text-ink'
        }`}
      >
        {compact ? 'Vip' : 'Vip Solar'}
      </span>
      <span aria-hidden="true" className="text-brand font-display text-[1.75rem] leading-none font-bold">
        .
      </span>
    </a>
  )
}
