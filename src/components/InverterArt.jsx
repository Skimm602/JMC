/**
 * Vector render of a wall-mount string inverter.
 *
 * Drawn rather than photographed on purpose: it keeps the repo asset-free,
 * scales cleanly at any breakpoint, and lets the status LEDs animate so the
 * hero communicates "this thing is live and exporting" at a glance.
 */
export default function InverterArt({ className = '' }) {
  const fins = Array.from({ length: 17 }, (_, i) => 66 + i * 14)

  return (
    <svg viewBox="0 0 360 470" className={className} role="img" aria-label="JMC H6 hybrid inverter, front view">
      <defs>
        <linearGradient id="chassis" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#26364f" />
          <stop offset="45%" stopColor="#16223a" />
          <stop offset="100%" stopColor="#0a1120" />
        </linearGradient>
        <linearGradient id="finFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#31435f" />
          <stop offset="100%" stopColor="#1b2740" />
        </linearGradient>
        <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#071426" />
          <stop offset="100%" stopColor="#040d1a" />
        </linearGradient>
        <linearGradient id="topEdge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(244,248,255,0)" />
          <stop offset="50%" stopColor="rgba(244,248,255,0.32)" />
          <stop offset="100%" stopColor="rgba(244,248,255,0)" />
        </linearGradient>
      </defs>

      {/* mounting bracket peeking out behind the chassis */}
      <rect x="52" y="26" width="256" height="18" rx="4" fill="#0a1120" opacity="0.9" />

      {/* main chassis */}
      <rect x="40" y="34" width="280" height="404" rx="20" fill="url(#chassis)" stroke="#38496a" strokeWidth="1.2" />

      {/* specular highlight along the top edge */}
      <rect x="56" y="35.5" width="248" height="1.5" fill="url(#topEdge)" />

      {/* heat-sink fin stack */}
      <g>
        {fins.map((x) => (
          <rect key={x} x={x} y="58" width="7" height="118" rx="2" fill="url(#finFace)" />
        ))}
        {fins.map((x) => (
          <rect key={`hl-${x}`} x={x} y="58" width="1.5" height="118" fill="#4a5f82" opacity="0.55" />
        ))}
      </g>

      {/* model plate */}
      <rect x="66" y="192" width="228" height="26" rx="4" fill="#0d1729" stroke="#2c3d59" strokeWidth="1" />
      <text
        x="78"
        y="209.5"
        fill="var(--color-mute)"
        fontFamily="var(--font-jetbrains), monospace"
        fontSize="11"
        letterSpacing="2.4"
      >
        JMC H6-10K HYBRID
      </text>

      {/* display */}
      <rect x="66" y="232" width="228" height="104" rx="8" fill="url(#screen)" stroke="#2c3d59" strokeWidth="1.2" />
      <text
        x="82"
        y="262"
        fill="var(--color-mute-dim)"
        fontFamily="var(--font-jetbrains), monospace"
        fontSize="10"
        letterSpacing="2"
      >
        AC OUTPUT
      </text>
      <text
        x="82"
        y="300"
        fill="var(--color-solar-400)"
        fontFamily="var(--font-jetbrains), monospace"
        fontSize="34"
        fontWeight="500"
      >
        8.42
      </text>
      <text x="196" y="300" fill="var(--color-mute)" fontFamily="var(--font-jetbrains), monospace" fontSize="14">
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
            rx="1.5"
            fill="var(--color-volt-500)"
            opacity={0.35 + i * 0.09}
          />
        ))}
      </g>
      <text
        x="212"
        y="324"
        fill="var(--color-good)"
        fontFamily="var(--font-jetbrains), monospace"
        fontSize="10"
        letterSpacing="1.4"
      >
        GRID OK
      </text>

      {/* status LEDs */}
      <g>
        <circle cx="82" cy="366" r="5.5" fill="var(--color-good)">
          <animate attributeName="opacity" values="1;0.35;1" dur="2.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="108" cy="366" r="5.5" fill="var(--color-solar-500)">
          <animate attributeName="opacity" values="0.45;1;0.45" dur="1.7s" repeatCount="indefinite" />
        </circle>
        <circle cx="134" cy="366" r="5.5" fill="#20304a" />
        <text
          x="152"
          y="370"
          fill="var(--color-mute-dim)"
          fontFamily="var(--font-jetbrains), monospace"
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
        fill="var(--color-chalk)"
        fontFamily="var(--font-space-grotesk), sans-serif"
        fontSize="17"
        fontWeight="700"
        letterSpacing="5"
        opacity="0.85"
      >
        JMC
      </text>

      {/* conduit knockouts on the underside */}
      <g fill="#060d1a" stroke="#2c3d59" strokeWidth="1">
        <rect x="92" y="424" width="34" height="16" rx="4" />
        <rect x="146" y="424" width="34" height="16" rx="4" />
        <rect x="200" y="424" width="34" height="16" rx="4" />
      </g>
    </svg>
  )
}
