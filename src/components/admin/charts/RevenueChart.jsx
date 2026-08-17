'use client'

/**
 * The trailing-12-months revenue bar chart. Same hand-built SVG house style
 * as components/DeratingCurve.jsx — scale helpers, hush gridlines, mono tick
 * type — rather than a charting dependency, for one chart this small.
 *
 * One series, one hue: revenue-over-time is a magnitude, not an identity, so
 * there is nothing here a legend or a second colour would add. Every bar
 * carries a native <title> for the exact figure on hover; the current month
 * and the peak month are labelled directly, since those are the two figures
 * someone glances at this chart to find.
 */

const X0 = 44
const X1 = 860
const Y0 = 16
const Y1 = 240
const GAP = 0.32 // fraction of each slot left as space between bars

export default function RevenueChart({ months, formatValue }) {
  const max = Math.max(1, ...months.map((m) => m.revenue))
  const slot = (X1 - X0) / months.length
  const barWidth = slot * (1 - GAP)

  const y = (v) => Y1 - (v / max) * (Y1 - Y0)
  const peakIndex = months.reduce((best, m, i) => (m.revenue > months[best].revenue ? i : best), 0)
  const lastIndex = months.length - 1

  const Y_TICKS = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max)

  return (
    <svg
      viewBox={`0 0 900 288`}
      role="img"
      aria-label={`Revenue by month, last ${months.length} months. Peak month: ${months[peakIndex].label}, ${formatValue(months[peakIndex].revenue)}.`}
      className="w-full"
    >
      {/* gridlines */}
      <g className="stroke-hush/50">
        {Y_TICKS.map((v) => (
          <line key={v} x1={X0} y1={y(v)} x2={X1} y2={y(v)} strokeWidth="1" />
        ))}
      </g>

      {/* y labels */}
      <g className="fill-ink-soft font-mono text-[15px]" textAnchor="end">
        {Y_TICKS.map((v) => (
          <text key={v} x={X0 - 10} y={y(v) + 4}>
            {formatValue(v, { compact: true })}
          </text>
        ))}
      </g>

      {/* baseline */}
      <line x1={X0} y1={Y1} x2={X1} y2={Y1} className="stroke-ink-soft" strokeWidth="1.25" />

      {/* bars */}
      {months.map((m, i) => {
        const x = X0 + i * slot + (slot - barWidth) / 2
        const barY = y(m.revenue)
        const isCallout = i === peakIndex || i === lastIndex

        return (
          <g key={m.key}>
            <rect
              x={x}
              y={barY}
              width={barWidth}
              height={Math.max(0, Y1 - barY)}
              rx={3}
              className={isCallout ? 'fill-cool-600' : 'fill-cool-500/70'}
            >
              <title>
                {m.label}: {formatValue(m.revenue)} · {m.orders} {m.orders === 1 ? 'order' : 'orders'}
              </title>
            </rect>

            {isCallout && m.revenue > 0 && (
              <text
                x={x + barWidth / 2}
                y={barY - 8}
                textAnchor="middle"
                className="fill-ink font-mono text-[15px] font-medium"
              >
                {formatValue(m.revenue, { compact: true })}
              </text>
            )}

            <text
              x={x + barWidth / 2}
              y={Y1 + 22}
              textAnchor="middle"
              className="fill-ink-soft font-mono text-[14px]"
            >
              {m.label.split(' ')[0]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
