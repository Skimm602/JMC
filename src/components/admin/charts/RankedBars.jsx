'use client'

import { cx } from '../../ui.jsx'

/**
 * Top products, as horizontal bars. Identity is carried by the row label,
 * not colour, so — same reasoning as RevenueChart — one hue is enough:
 * there is nothing a second colour would distinguish that the name doesn't
 * already. Every bar is labelled with its exact value, since a ranked list
 * this short (eight rows at most) is read for the numbers, not the shape.
 */
export default function RankedBars({ items, formatValue, tone = 'cool' }) {
  const max = Math.max(1, ...items.map((i) => i.value))

  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const pct = Math.max(2, (item.value / max) * 100)
        return (
          <div key={item.id} className="grid gap-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-ink min-w-0 truncate font-medium">{item.name}</span>
              <span className={cx('font-mono text-xs tabular-nums', tone === 'hot' ? 'text-hot-600' : 'text-ink')}>
                {formatValue(item.value)}
              </span>
            </div>
            <div
              className="bg-sheet h-2.5 w-full overflow-hidden rounded-full"
              role="img"
              aria-label={`${item.name}: ${formatValue(item.value)}`}
            >
              <div className={cx('h-full rounded-full', tone === 'hot' ? 'bg-hot-600' : 'bg-cool-600')} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
