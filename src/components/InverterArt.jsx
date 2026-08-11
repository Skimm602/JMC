/**
 * Vector render of a wall-mount string inverter.
 *
 * Drawn rather than photographed on purpose: it keeps the repo asset-free,
 * scales cleanly at any breakpoint, and lets the status LEDs animate so the
 * unit reads as live rather than as a catalogue thumbnail.
 *
 * The enclosure is anthracite because real ones are. It sits on the lit
 * bands as a solid object rather than a floating card.
 */
export default function InverterArt({ className = '' }) {
  const fins = Array.from({ length: 17 }, (_, i) => 66 + i * 14)

  return (
    <svg viewBox="0 0 360 470" className={className} role="img" aria-label="VIP H6 hybrid inverter, front view">
      <defs>
        <linearGradient id="chassis" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a4552" />
          <stop offset="45%" stopColor="#232b36" />
          <stop offset="100%" stopColor="#141a22" />
        </linearGradient>
        <linearGradient id="finFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#454f5e" />
          <stop offset="100%" stopColor="#262e3a" />
        </linearGradient>
        <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0c1119" />
          <stop offset="100%" stopColor="#070b11" />
        </linearGradient>
        <linearGradient id="topEdge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(232,241,251,0)" />
          <stop offset="50%" stopColor="rgba(232,241,251,0.35)" />
          <stop offset="100%" stopColor="rgba(232,241,251,0)" />
        </linearGradient>
      </defs>

      {/* mounting bracket peeking out behind the chassis */}
      <rect x="52" y="26" width="256" height="18" rx="2" fill="#111720" opacity="0.9" />

      {/* main chassis */}
      <rect x="40" y="34" width="280" height="404" rx="6" fill="url(#chassis)" stroke="#4f5a6b" strokeWidth="1.2" />

      {/* specular highlight along the top edge */}
      <rect x="56" y="35.5" width="248" height="1.5" fill="url(#topEdge)" />

      {/* heat-sink fin stack — the reason the curve stays flat */}
      <g>
        {fins.map((x) => (
          <rect key={x} x={x} y="58" width="7" height="118" rx="1" fill="url(#finFace)" />
        ))}
        {fins.map((x) => (
          <rect key={`hl-${x}`} x={x} y="58" width="1.5" height="118" fill="#66728a" opacity="0.5" />
        ))}
      </g>

      {/* model plate */}
      <rect x="66" y="192" width="228" height="26" rx="2" fill="#0f141c" stroke="#414b5a" strokeWidth="1" />
      <text
        x="78"
        y="209.5"
        fill="var(--color-glint-soft)"
        fontFamily="var(--font-plex-mono), monospace"
        fontSize="11"
        letterSpacing="2.4"
      >
        VIP H6-10K HYBRID
      </text>

      {/* display */}
      <rect x="66" y="232" width="228" height="104" rx="3" fill="url(#screen)" stroke="#414b5a" strokeWidth="1.2" />
      <text
        x="82"
        y="262"
        fill="var(--color-glint-soft)"
        fontFamily="var(--font-plex-mono), monospace"
        fontSize="10"
        letterSpacing="2"
      >
        AC OUTPUT
      </text>
      <text
        x="82"
        y="300"
        fill="var(--color-cool-400)"
        fontFamily="var(--font-plex-mono), monospace"
        fontSize="34"
        fontWeight="500"
      >
        8.42
      </text>
      <text
        x="196"
        y="300"
        fill="var(--color-glint-soft)"
        fontFamily="var(--font-plex-mono), monospace"
        fontSize="14"
      >
        kW
      </text>

      {/* mini generation bar chart on the display */}
      <g>
        {[10, 18, 26, 22, 30, 24, 14].map((h, i) => (
          <rect
            key={i}
            x={82 + i * 15}
            y={324 - h}
            width="9"
            height={h}
            fill="var(--color-cool-500)"
            opacity={0.4 + i * 0.085}
          />
        ))}
      </g>
      <text
        x="212"
        y="324"
        fill="var(--color-cool-400)"
        fontFamily="var(--font-plex-mono), monospace"
        fontSize="10"
        letterSpacing="1.4"
      >
        GRID OK
      </text>

      {/* status LEDs — fault sits dark, because nothing is wrong */}
      <g>
        <circle cx="82" cy="366" r="5.5" fill="var(--color-cool-400)">
          <animate attributeName="opacity" values="1;0.35;1" dur="2.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="108" cy="366" r="5.5" fill="var(--color-glint-soft)">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.7s" repeatCount="indefinite" />
        </circle>
        <circle cx="134" cy="366" r="5.5" fill="#28303c" />
        <text
          x="152"
          y="370"
          fill="var(--color-glint-soft)"
          fontFamily="var(--font-plex-mono), monospace"
          fontSize="9"
          letterSpacing="1.8"
        >
          RUN / EXPORT / FAULT
        </text>
      </g>

      {/* brand badge */}
      <text
        x="180"
        y="404"
        textAnchor="middle"
        fill="var(--color-glint)"
        fontFamily="var(--font-archivo), sans-serif"
        fontSize="17"
        fontWeight="700"
        letterSpacing="5"
        opacity="0.85"
      >
        VIP
      </text>

      {/* conduit knockouts on the underside */}
      <g fill="#0b1018" stroke="#414b5a" strokeWidth="1">
        <rect x="92" y="424" width="34" height="16" rx="2" />
        <rect x="146" y="424" width="34" height="16" rx="2" />
        <rect x="200" y="424" width="34" height="16" rx="2" />
      </g>
    </svg>
  )
}
