'use client'

import { useEffect, useState } from 'react'
import { cx } from './ui.jsx'

const SECTIONS = [
  { id: 'top', n: '00', label: 'Overview' },
  { id: 'products', n: '01', label: 'Range' },
  { id: 'why', n: '02', label: 'Engineering' },
  { id: 'installers', n: '03', label: 'Program' },
  { id: 'register', n: '04', label: 'Register' },
]

/**
 * The page's spine: a fixed hairline with a node per section, doubling as
 * wayfinding. Replaces the usual centred-section rhythm with an off-centre
 * axis that every band hangs from.
 *
 * Hidden below lg — on narrow screens it would cost more width than it earns.
 */
export default function SectionIndex() {
  const [active, setActive] = useState('top')

  useEffect(() => {
    const targets = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean)
    if (!targets.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Whichever tracked section covers the upper third of the viewport wins.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.05, 0.25, 0.5] },
    )

    targets.forEach((t) => observer.observe(t))
    return () => observer.disconnect()
  }, [])

  return (
    <nav
      aria-label="Section index"
      className="pointer-events-none fixed top-0 left-0 z-40 hidden h-screen w-[88px] flex-col items-center justify-center lg:flex"
    >
      {/* the spine itself */}
      <span aria-hidden="true" className="from-ink-700/0 via-ink-600 to-ink-700/0 absolute inset-y-16 left-[43px] w-px bg-gradient-to-b" />

      <ol className="pointer-events-auto relative flex flex-col gap-7">
        {SECTIONS.map((s) => {
          const on = active === s.id
          return (
            <li key={s.id}>
              <a href={`#${s.id}`} className="group flex items-center gap-3" aria-current={on ? 'true' : undefined}>
                <span
                  className={cx(
                    'font-mono text-[9px] tabular-nums transition-colors duration-300',
                    on ? 'text-solar-400' : 'text-mute-dim/50 group-hover:text-mute',
                  )}
                >
                  {s.n}
                </span>
                <span
                  aria-hidden="true"
                  className={cx(
                    'block transition-all duration-300',
                    on
                      ? 'bg-solar-500 h-2 w-2 shadow-[0_0_12px_2px_rgba(255,176,32,0.6)]'
                      : 'bg-ink-600 group-hover:bg-mute-dim h-1.5 w-1.5',
                  )}
                  style={{ clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' }}
                />
                <span
                  className={cx(
                    'font-mono text-[10px] tracking-[0.16em] whitespace-nowrap uppercase transition-all duration-300',
                    on ? 'text-chalk opacity-100' : 'text-mute-dim opacity-0 group-hover:opacity-100',
                  )}
                >
                  {s.label}
                </span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
