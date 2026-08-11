/**
 * The job an inverter actually does, drawn as a single-line schematic — sun
 * to array (DC), through the inverter, out to the house and grid (AC).
 *
 * It opens the range section because that section's claim is "roof to
 * switchboard": the diagram is the claim, so the heading does not have to
 * carry it alone.
 *
 * The inverter node is the only hot element on the page's cool side, which
 * is literally true — it is where the conversion loss becomes heat, and
 * therefore where the whole thermal argument lives.
 */
export default function EnergyFlow({ className = '' }) {
  const DC = 'var(--color-cool-600)'
  const AC = 'var(--color-ink)'
  const HOT = 'var(--color-hot-600)'
  const STRUCT = 'var(--color-ink-soft)'

  const nodes = [
    { x: 90, label: 'Irradiance', sub: '1041 W/m²' },
    { x: 355, label: 'Array', sub: '24 × 440 W' },
    { x: 620, label: 'VIP H6-10K', sub: 'η 98.6%', highlight: true },
    { x: 885, label: 'Loads', sub: '6.1 kW' },
    { x: 1120, label: 'Grid', sub: 'export 2.1 kW' },
  ]

  return (
    <svg
      viewBox="0 0 1210 200"
      className={className}
      role="img"
      aria-label="Energy flow from array through inverter to loads and grid"
    >
      {/* ---------------------------- conductors ---------------------------- */}
      <g stroke={DC} strokeWidth="1.6" fill="none">
        <line x1="126" y1="86" x2="318" y2="86" strokeDasharray="6 8" className="animate-dash" />
        <line x1="392" y1="86" x2="578" y2="86" strokeDasharray="6 8" className="animate-dash" />
      </g>
      <g stroke={AC} strokeWidth="1.6" fill="none" opacity="0.7">
        <line x1="662" y1="86" x2="848" y2="86" strokeDasharray="6 8" className="animate-dash" />
        <line x1="922" y1="86" x2="1086" y2="86" strokeDasharray="6 8" className="animate-dash" />
      </g>

      {/* conversion markers */}
      <text
        x="484"
        y="72"
        fill={DC}
        fontFamily="var(--font-plex-mono), monospace"
        fontSize="10"
        letterSpacing="1.4"
        textAnchor="middle"
      >
        8.42 kW DC
      </text>
      <text
        x="792"
        y="72"
        fill="var(--color-ink-soft)"
        fontFamily="var(--font-plex-mono), monospace"
        fontSize="10"
        letterSpacing="1.4"
        textAnchor="middle"
      >
        8.18 kW AC
      </text>

      {/* ------------------------------- sun ------------------------------- */}
      <circle cx="90" cy="86" r="13" fill="none" stroke={HOT} strokeWidth="1.8" />
      <g stroke={HOT} strokeWidth="1.6" strokeLinecap="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const r = (deg * Math.PI) / 180
          return (
            <line
              key={deg}
              x1={90 + Math.cos(r) * 19}
              y1={86 + Math.sin(r) * 19}
              x2={90 + Math.cos(r) * 25}
              y2={86 + Math.sin(r) * 25}
            />
          )
        })}
      </g>

      {/* ------------------------------ array ------------------------------ */}
      <g transform="translate(355 86)">
        <path d="M-34 12 L-22 -14 L34 -14 L22 12 Z" fill="none" stroke={STRUCT} strokeWidth="1.4" />
        <g stroke={DC} strokeWidth="1" opacity="0.6">
          <path d="M-26 12 L-14 -14M-14 12 L-2 -14M-2 12 L10 -14M10 12 L22 -14" />
          <path d="M-30 -1 L28 -1" />
        </g>
        <line x1="0" y1="12" x2="0" y2="26" stroke={STRUCT} strokeWidth="1.4" />
      </g>

      {/* ---------------------------- inverter ----------------------------- */}
      {/* the only hot node: conversion loss is heat, which is the argument */}
      <g transform="translate(620 86)">
        <rect x="-30" y="-40" width="60" height="80" rx="3" fill="var(--color-glare)" stroke={HOT} strokeWidth="1.8" />
        <g stroke={HOT} strokeWidth="1" opacity="0.55">
          {[-20, -14, -8, -2, 4, 10, 16].map((x) => (
            <line key={x} x1={x} y1="-32" x2={x} y2="-14" />
          ))}
        </g>
        <rect x="-20" y="-8" width="40" height="16" rx="1.5" fill="var(--color-shade)" />
        <text
          x="0"
          y="3.5"
          fill="var(--color-cool-400)"
          fontFamily="var(--font-plex-mono), monospace"
          fontSize="8"
          textAnchor="middle"
        >
          8.18
        </text>
        <circle cx="-8" cy="22" r="3" fill="var(--color-cool-600)">
          <animate attributeName="opacity" values="1;0.3;1" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="2" cy="22" r="3" fill={HOT}>
          <animate attributeName="opacity" values="0.35;1;0.35" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="12" cy="22" r="3" fill="var(--color-sheet-edge)" />
      </g>

      {/* ------------------------------ house ------------------------------ */}
      <g transform="translate(885 86)" stroke={STRUCT} strokeWidth="1.4" fill="none">
        <path d="M-26 6 L0 -18 L26 6 L26 30 L-26 30 Z" />
        <path d="M-7 30 L-7 14 L7 14 L7 30" stroke={AC} strokeWidth="1.2" opacity="0.7" />
      </g>

      {/* ------------------------------ pylon ------------------------------ */}
      <g transform="translate(1120 86)" stroke={STRUCT} strokeWidth="1.4" fill="none">
        <path d="M-16 32 L-7 -22 L7 -22 L16 32" />
        <path d="M-13 10 L13 10M-10 -6 L10 -6M-14 -22 L14 -22" />
        <path d="M-11 12 L9 -8M-9 -8 L11 12" strokeWidth="0.9" opacity="0.6" />
      </g>

      {/* ------------------------------ labels ----------------------------- */}
      {nodes.map((n) => (
        <g key={n.x}>
          <text
            x={n.x}
            y="152"
            textAnchor="middle"
            fill={n.highlight ? 'var(--color-hot-600)' : 'var(--color-ink)'}
            fontFamily="var(--font-plex-mono), monospace"
            fontSize="10.5"
            fontWeight={n.highlight ? 500 : 400}
            letterSpacing="1.4"
          >
            {n.label.toUpperCase()}
          </text>
          <text
            x={n.x}
            y="169"
            textAnchor="middle"
            fill="var(--color-ink-soft)"
            fontFamily="var(--font-plex-mono), monospace"
            fontSize="9.5"
          >
            {n.sub}
          </text>
        </g>
      ))}
    </svg>
  )
}
