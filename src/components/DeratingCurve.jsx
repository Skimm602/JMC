/**
 * The page's thesis, drawn.
 *
 * Every inverter datasheet contains a derating curve and almost every
 * manufacturer buries it in an appendix, because it is the chart that shows
 * what the hardware actually does once a roof gets hot. Putting it in the
 * hero is the whole argument: JMC holds rated output to 45 °C while the
 * class average has already started giving power back at 35 °C.
 *
 * The vertical marker is the point of the chart for a Philippine installer —
 * it lands where they actually operate, not at some lab condition.
 */

/* plot frame, in viewBox units */
const X0 = 70
const X1 = 860
const Y0 = 40
const Y1 = 330

const T_MIN = 20
const T_MAX = 60
/* the domain is cropped to where the curves actually live, so the plot is
   filled rather than half empty */
const O_MIN = 48
const O_MAX = 104

const sx = (t) => X0 + ((t - T_MIN) / (T_MAX - T_MIN)) * (X1 - X0)
const sy = (o) => Y1 - ((o - O_MIN) / (O_MAX - O_MIN)) * (Y1 - Y0)

/* [ambient °C, % of rated output] */
const JMC = [
  [20, 100],
  [45, 100],
  [60, 78],
]

const CLASS_AVG = [
  [20, 100],
  [35, 100],
  [60, 55],
]

const DESIGN_POINT = 34

const line = (pts) => pts.map(([t, o], i) => `${i ? 'L' : 'M'}${sx(t)} ${sy(o)}`).join(' ')

/** The gap between the two curves — the output you keep once it gets hot. */
const marginBand = [
  `M${sx(35)} ${sy(100)}`,
  `L${sx(45)} ${sy(100)}`,
  `L${sx(60)} ${sy(78)}`,
  `L${sx(60)} ${sy(55)}`,
  'Z',
].join(' ')

const Y_TICKS = [50, 60, 70, 80, 90, 100]
const X_TICKS = [20, 25, 30, 35, 40, 45, 50, 55, 60]
/* thinned set for narrow screens, where the full set collides */
const X_TICKS_SM = [20, 30, 40, 45, 60]

/**
 * Type inside a viewBox scales with the drawing, so a size that reads on a
 * phone disappears on a desktop and vice versa. These three steps are sized
 * backwards from the rendered result: the chart is the page's whole argument,
 * and at the old flat 13 units its axis labels came out around 8.8px on a
 * desktop — the least legible text on the page, on the one element that has
 * to be read. Each step targets roughly 11–15px at the widths it covers.
 */
const TICK_TYPE = 'text-[17px] max-md:text-[22px] max-sm:text-[30px]'

export default function DeratingCurve({ className = '' }) {
  return (
    <svg
      viewBox="0 0 900 418"
      className={className}
      role="img"
      aria-label="Derating curve. JMC inverters hold 100 percent of rated output up to 45 degrees Celsius ambient and 78 percent at 60 degrees. The class average begins derating at 35 degrees and reaches 55 percent at 60 degrees. Cebu's afternoon design condition of 34 degrees falls inside JMC's flat region."
    >
      {/* ------------------------------- grid ------------------------------- */}
      <g className="stroke-hush/50">
        {Y_TICKS.map((o) => (
          <line key={o} x1={X0} y1={sy(o)} x2={X1} y2={sy(o)} strokeWidth="1" />
        ))}
      </g>

      {/* axes */}
      <g className="stroke-ink-soft" strokeWidth="1.25">
        <line x1={X0} y1={Y0} x2={X0} y2={Y1} />
        <line x1={X0} y1={Y1} x2={X1} y2={Y1} />
      </g>

      {/* y labels */}
      <g className={`fill-ink-soft font-mono ${TICK_TYPE}`} textAnchor="end">
        {Y_TICKS.map((o) => (
          <text key={o} x={X0 - 14} y={sy(o) + 6}>
            {o}
          </text>
        ))}
      </g>

      {/* x labels — thinned below sm so they never collide */}
      <g className={`fill-ink-soft font-mono ${TICK_TYPE}`} textAnchor="middle">
        {X_TICKS.map((t) => (
          <text
            key={t}
            x={sx(t)}
            y={Y1 + 30}
            className={X_TICKS_SM.includes(t) ? undefined : 'max-sm:hidden'}
          >
            {t}
          </text>
        ))}
      </g>

      {/* ---------------------------- margin band --------------------------- */}
      <path
        d={marginBand}
        className="fill-cool-500/20 animate-fade-in"
        style={{ animationDelay: '1.25s' }}
      />

      {/* ------------------------- the design condition ---------------------
          The point of the whole figure for a Philippine installer: where
          they actually operate, not where the lab does. */}
      <g className="animate-fade-in" style={{ animationDelay: '1.5s' }}>
        <line
          x1={sx(DESIGN_POINT)}
          y1={Y0}
          x2={sx(DESIGN_POINT)}
          y2={Y1}
          className="stroke-hot-600"
          strokeWidth="1.25"
          strokeDasharray="3 5"
        />
        <circle cx={sx(DESIGN_POINT)} cy={sy(100)} r="4.5" className="fill-hot-600" />
        <text
          x={sx(DESIGN_POINT)}
          y={Y0 - 10}
          textAnchor="middle"
          className={`fill-hot-600 font-mono font-medium ${TICK_TYPE}`}
        >
          34 °C
        </text>
      </g>

      {/* ------------------------------ curves ------------------------------ */}
      {/* class average first, then JMC drawing over it holding flat */}
      <path
        d={line(CLASS_AVG)}
        pathLength="1"
        fill="none"
        strokeWidth="2"
        strokeDasharray="1"
        strokeDashoffset="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-hot-500 animate-draw"
        style={{ animationDelay: '0.15s' }}
      />
      <path
        d={line(JMC)}
        pathLength="1"
        fill="none"
        strokeWidth="3"
        strokeDasharray="1"
        strokeDashoffset="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-cool-600 animate-draw"
        style={{ animationDelay: '0.5s' }}
      />

      {/* --------------------------- inline callouts ------------------------ */}
      <g className="animate-fade-in" style={{ animationDelay: '1.6s' }}>
        {/* both callouts sit in the empty half of their own curve, so neither
            crowds the axis titles or the plotted lines */}
        <text
          x={sx(21)}
          y={sy(100) + 26}
          className={`fill-cool-700 font-mono font-medium ${TICK_TYPE}`}
        >
          JMC — flat to 45 °C
        </text>
        <text x={sx(49)} y={sy(64)} className={`fill-hot-600 font-mono ${TICK_TYPE}`}>
          class average
        </text>
      </g>

      {/* axis titles */}
      <text
        x={X0}
        y={Y1 + 72}
        className={`fill-ink-soft font-mono tracking-[0.14em] uppercase ${TICK_TYPE}`}
      >
        Ambient °C
      </text>
      <text
        x={X0}
        y={Y0 - 12}
        textAnchor="start"
        className={`fill-ink-soft font-mono tracking-[0.14em] uppercase ${TICK_TYPE}`}
      >
        % rated
      </text>
    </svg>
  )
}
