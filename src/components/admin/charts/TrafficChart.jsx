'use client'

/**
 * Visitors over time, one bar per period. Same hand-built SVG as
 * RevenueChart — scale helpers, hush gridlines, mono ticks — so the charts on
 * this tab read as one instrument rather than two libraries.
 *
 * It draws days and months alike: the caller passes points already labelled,
 * and `tickEvery` decides how many get an axis label, since thirty days is
 * more than the axis can spell out but twelve months is not. Every bar
 * carries its own <title> for the exact figures, and the busiest period and
 * the current one are labelled outright — the two a glance is looking for.
 */

const X0 = 44
const X1 = 860
const Y0 = 16
const Y1 = 240
const GAP = 0.34 // fraction of each slot left as space between bars

export default function TrafficChart({ points, tickEvery = 1, unit = 'visitor' }) {
  const max = Math.max(1, ...points.map((p) => p.visitors))
  const slot = (X1 - X0) / points.length
  const barWidth = slot * (1 - GAP)

  const y = (v) => Y1 - (v / max) * (Y1 - Y0)

  const peakIndex = points.reduce((best, p, i) => (p.visitors > points[best].visitors ? i : best), 0)
  const lastIndex = points.length - 1

  // A whole-number axis. Visitors arrive as people, and a gridline reading
  // "12.5 visitors" is one nobody can act on.
  const step = Math.max(1, Math.ceil(max / 4))
  const ticks = []
  for (let v = 0; v <= max; v += step) ticks.push(v)

  return (
    <svg
      viewBox="0 0 900 288"
      role="img"
      aria-label={`Visitors per ${unit === 'visitor' ? 'period' : unit}, ${points.length} periods. Busiest: ${points[peakIndex].label}, ${points[peakIndex].visitors} visitors.`}
      className="w-full"
    >
      {/* gridlines */}
      <g className="stroke-hush/50">
        {ticks.map((v) => (
          <line key={v} x1={X0} y1={y(v)} x2={X1} y2={y(v)} strokeWidth="1" />
        ))}
      </g>

      {/* y labels */}
      <g className="fill-ink-soft font-mono text-[15px]" textAnchor="end">
        {ticks.map((v) => (
          <text key={v} x={X0 - 10} y={y(v) + 4}>
            {v}
          </text>
        ))}
      </g>

      {/* baseline */}
      <line x1={X0} y1={Y1} x2={X1} y2={Y1} className="stroke-ink-soft" strokeWidth="1.25" />

      {points.map((p, i) => {
        const x = X0 + i * slot + (slot - barWidth) / 2
        const barY = y(p.visitors)
        const isCallout = (i === peakIndex && p.visitors > 0) || i === lastIndex
        const isTick = i % tickEvery === 0 || i === lastIndex

        return (
          <g key={p.key}>
            <rect
              x={x}
              y={barY}
              width={barWidth}
              height={Math.max(0, Y1 - barY)}
              rx={2}
              className={isCallout ? 'fill-cool-600' : 'fill-cool-500/70'}
            >
              <title>
                {p.label}: {p.visitors} {p.visitors === 1 ? 'visitor' : 'visitors'} · {p.views}{' '}
                {p.views === 1 ? 'page view' : 'page views'}
              </title>
            </rect>

            {isCallout && p.visitors > 0 && (
              <text
                x={x + barWidth / 2}
                y={barY - 8}
                textAnchor="middle"
                className="fill-ink font-mono text-[15px] font-medium"
              >
                {p.visitors}
              </text>
            )}

            {isTick && (
              <text
                x={x + barWidth / 2}
                y={Y1 + 22}
                textAnchor="middle"
                className="fill-ink-soft font-mono text-[14px]"
              >
                {p.tickLabel}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
