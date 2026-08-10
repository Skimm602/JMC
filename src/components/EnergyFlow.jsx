/**
 * The hero's primary visual: the actual job an inverter does, drawn as a
 * single-line schematic — sun to array (DC), through the inverter, out to the
 * house and grid (AC).
 *
 * The DC and AC halves are deliberately different colours, and the conductors
 * animate, so the diagram carries the product's role rather than being a
 * decorative product shot.
 */
export default function EnergyFlow({ className = '' }) {
  const DC = 'var(--color-volt-400)'
  const AC = 'var(--color-solar-500)'

  const nodes = [
    { x: 90, label: 'Irradiance', sub: '1041 W/m²' },
    { x: 355, label: 'Array', sub: '24 × 440 W' },
    { x: 620, label: 'JMC H6-10K', sub: 'η 98.6%', highlight: true },
    { x: 885, label: 'Loads', sub: '6.1 kW' },
    { x: 1120, label: 'Grid', sub: 'export 2.1 kW' },
  ]

  return (
    <svg viewBox="0 0 1210 200" className={className} role="img" aria-label="Energy flow from array through inverter to loads and grid">
      <defs>
        <radialGradient id="sunGlow">
          <stop offset="0%" stopColor="rgba(255,176,32,0.55)" />
          <stop offset="100%" stopColor="rgba(255,176,32,0)" />
        </radialGradient>
        <linearGradient id="invBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#26364f" />
          <stop offset="100%" stopColor="#0b1424" />
        </linearGradient>
      </defs>

      {/* ---------------------------- conductors ---------------------------- */}
      {/* DC side */}
      <g stroke={DC} strokeWidth="1.4" fill="none" opacity="0.85">
        <line x1="126" y1="86" x2="318" y2="86" strokeDasharray="6 8" className="animate-dash" />
        <line x1="392" y1="86" x2="578" y2="86" strokeDasharray="6 8" className="animate-dash" />
      </g>
      {/* AC side */}
      <g stroke={AC} strokeWidth="1.4" fill="none" opacity="0.9">
        <line x1="662" y1="86" x2="848" y2="86" strokeDasharray="6 8" className="animate-dash" />
        <line x1="922" y1="86" x2="1086" y2="86" strokeDasharray="6 8" className="animate-dash" />
      </g>

      {/* conversion markers */}
      <text x="484" y="74" fill={DC} fontFamily="var(--font-jetbrains), monospace" fontSize="9" letterSpacing="1.6" textAnchor="middle">
        8.42 kW DC
      </text>
      <text x="792" y="74" fill={AC} fontFamily="var(--font-jetbrains), monospace" fontSize="9" letterSpacing="1.6" textAnchor="middle">
        8.18 kW AC
      </text>

      {/* ------------------------------- sun ------------------------------- */}
      <circle cx="90" cy="86" r="34" fill="url(#sunGlow)" />
      <circle cx="90" cy="86" r="13" fill="none" stroke={AC} strokeWidth="1.6" />
      <g stroke={AC} strokeWidth="1.4" strokeLinecap="round" opacity="0.75">
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
        <g stroke="#3d5378" strokeWidth="1.2" fill="#101c30">
          <path d="M-34 12 L-22 -14 L34 -14 L22 12 Z" />
        </g>
        <g stroke="#2b7fff" strokeWidth="0.8" opacity="0.55">
          <path d="M-26 12 L-14 -14M-14 12 L-2 -14M-2 12 L10 -14M10 12 L22 -14" />
          <path d="M-30 -1 L28 -1" />
        </g>
        <line x1="0" y1="12" x2="0" y2="26" stroke="#3d5378" strokeWidth="1.4" />
      </g>

      {/* ---------------------------- inverter ----------------------------- */}
      <g transform="translate(620 86)">
        <circle r="52" fill="url(#sunGlow)" opacity="0.5" />
        <rect x="-30" y="-40" width="60" height="80" rx="8" fill="url(#invBody)" stroke={AC} strokeWidth="1.6" />
        {/* fins */}
        <g stroke="#3d5378" strokeWidth="1">
          {[-20, -14, -8, -2, 4, 10, 16].map((x) => (
            <line key={x} x1={x} y1="-32" x2={x} y2="-14" />
          ))}
        </g>
        {/* tiny display */}
        <rect x="-20" y="-8" width="40" height="16" rx="2" fill="#040d1a" stroke="#2c3d59" strokeWidth="0.8" />
        <text x="0" y="3.5" fill={AC} fontFamily="var(--font-jetbrains), monospace" fontSize="8" textAnchor="middle">
          8.18
        </text>
        {/* status LEDs */}
        <circle cx="-8" cy="22" r="3" fill="var(--color-good)">
          <animate attributeName="opacity" values="1;0.3;1" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="2" cy="22" r="3" fill={AC}>
          <animate attributeName="opacity" values="0.35;1;0.35" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="12" cy="22" r="3" fill="#20304a" />
      </g>

      {/* ------------------------------ house ------------------------------ */}
      <g transform="translate(885 86)" stroke="#3d5378" strokeWidth="1.3" fill="none">
        <path d="M-26 6 L0 -18 L26 6 L26 30 L-26 30 Z" fill="#101c30" />
        <path d="M-7 30 L-7 14 L7 14 L7 30" stroke={AC} strokeWidth="1.1" />
      </g>

      {/* ------------------------------ pylon ------------------------------ */}
      <g transform="translate(1120 86)" stroke="#3d5378" strokeWidth="1.3" fill="none">
        <path d="M-16 32 L-7 -22 L7 -22 L16 32" />
        <path d="M-13 10 L13 10M-10 -6 L10 -6M-14 -22 L14 -22" />
        <path d="M-11 12 L9 -8M-9 -8 L11 12" strokeWidth="0.8" opacity="0.6" />
      </g>

      {/* ------------------------------ labels ----------------------------- */}
      {nodes.map((n) => (
        <g key={n.x}>
          <text
            x={n.x}
            y="152"
            textAnchor="middle"
            fill={n.highlight ? 'var(--color-chalk)' : 'var(--color-mute)'}
            fontFamily="var(--font-jetbrains), monospace"
            fontSize="10"
            letterSpacing="1.4"
          >
            {n.label.toUpperCase()}
          </text>
          <text
            x={n.x}
            y="168"
            textAnchor="middle"
            fill="var(--color-mute-dim)"
            fontFamily="var(--font-jetbrains), monospace"
            fontSize="9"
          >
            {n.sub}
          </text>
        </g>
      ))}
    </svg>
  )
}
