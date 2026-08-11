'use client'

import { useEffect, useState } from 'react'
import { cx } from './ui.jsx'

/**
 * The page's spine: a fixed hairline with a node per section, doubling as
 * wayfinding. It replaces the usual centred-section rhythm with an
 * off-centre axis that every band hangs from.
 *
 * No index numbers — Range / Engineering / Program / Register is not a
 * sequence, so numbering it would decorate rather than inform.
 *
 * `shade` marks the sections that sit on a dark band, so the spine can
 * invert with the surface it is currently floating over.
 *
 * Hidden below lg, where it would cost more width than it earns.
 */
const SECTIONS = [
  { id: 'top', label: 'Overview', shade: true },
  { id: 'products', label: 'Range' },
  { id: 'sizing', label: 'Sizing' },
  { id: 'why', label: 'Engineering', shade: true },
  { id: 'installers', label: 'Program' },
  { id: 'about', label: 'About', shade: true },
]

export default function SectionIndex() {
  const [active, setActive] = useState('top')

  useEffect(() => {
    const targets = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean)
    if (!targets.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Whichever tracked section covers most of the upper viewport wins.
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

  const onShade = SECTIONS.find((s) => s.id === active)?.shade

  return (
    <nav
      aria-label="Section index"
      className="pointer-events-none fixed top-0 left-0 z-40 hidden h-screen w-rail flex-col justify-center lg:flex"
    >
      <span
        aria-hidden="true"
        className={cx(
          'absolute inset-y-24 left-[34px] w-px transition-colors duration-500',
          onShade ? 'bg-rule-shade' : 'bg-rule',
        )}
      />

      {/* The list is pinned to the spine's x rather than centred in the
          column. Centring made every tick's position depend on how long its
          own label was, so the ticks sat off the spine — and off the left of
          the viewport, since the widest label made the list wider than the
          column. Labels are positioned out of flow for the same reason: they
          can now appear and disappear without moving a tick. */}
      <ol className="pointer-events-auto relative flex flex-col gap-8 pl-[34px]">
        {SECTIONS.map((s) => {
          const on = active === s.id
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="group relative flex h-4 items-center"
                aria-current={on ? 'page' : undefined}
              >
                {/* tick grows and heats when its section is in view */}
                <span
                  aria-hidden="true"
                  className={cx(
                    'block h-px transition-all duration-300',
                    on
                      ? 'bg-cool-600 w-6'
                      : onShade
                        ? 'bg-glint/40 group-hover:bg-glint w-3'
                        : 'bg-ink/40 group-hover:bg-ink w-3',
                  )}
                />
                {/* The section you are in stays named. Revealing every label
                    only on hover made the index unreadable unless you already
                    knew to point at it. */}
                <span
                  className={cx(
                    'label absolute left-8 whitespace-nowrap transition-opacity duration-300',
                    on
                      ? onShade
                        ? 'text-glint opacity-100'
                        : 'text-ink opacity-100'
                      : onShade
                        ? 'text-glint-soft opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                        : 'text-ink-soft opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
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
