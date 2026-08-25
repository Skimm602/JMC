'use client'

import { useEffect, useState } from 'react'
import { cx } from './ui.jsx'

/**
 * The page's spine: a fixed hairline with a node per section, doubling as
 * wayfinding. It replaces the usual centred-section rhythm with an
 * off-centre axis that every band hangs from.
 *
 * No index numbers — Products / Why Choose Us / About is not a sequence, so
 * numbering it would decorate rather than inform.
 *
 * `shade` marks the sections that sit on a dark band, so the spine can
 * invert with the surface it is currently floating over.
 *
 * Hidden below lg, where it would cost more width than it earns.
 *
 * The column is offset by however far the rail itself has been pushed in
 * (`--rail-inset` minus one rail), so on a window wider than the shell needs
 * the spine travels with the content rather than stranding itself against the
 * left edge of the screen. At 1376px and below that offset is zero and the
 * column is flush left, exactly as before. Everything inside keeps its own
 * offsets, so nothing here has to know the window is wide.
 */
const SECTIONS = [
  { id: 'top', label: 'Overview', shade: true },
  { id: 'products', label: 'Products' },
  { id: 'why-choose', label: 'Why Choose Us' },
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

  /**
   * Products is short enough to centre on the section itself. About is
   * different: the goal there isn't the middle of anything, it's landing
   * right as the band above finishes scrolling past — so "About us" is the
   * first thing on the dark band, sitting just clear of the nav bar rather
   * than buried mid-screen.
   */
  const SCROLL_TARGET = {
    products: { id: 'products', mode: 'center', at: 0.5 },
    // A touch below dead-centre: at 0.5 the section's own bottom edge sat
    // close enough to the viewport's bottom that About's dark band showed
    // as a sliver underneath it. Landing slightly higher up the page keeps
    // that out of view without the section reading as top-aligned.
    'why-choose': { id: 'why-choose', mode: 'center', at: 0.56 },
    about: { id: 'about-heading', mode: 'top', offset: 96 },
  }

  const onLinkClick = (e, id) => {
    const target = SCROLL_TARGET[id]
    if (!target) return
    const el = document.getElementById(target.id)
    if (!el) return
    e.preventDefault()

    const rect = el.getBoundingClientRect()
    const delta =
      target.mode === 'top' ? rect.top - target.offset : rect.top + rect.height / 2 - window.innerHeight * target.at
    window.scrollBy({ top: delta, behavior: 'smooth' })
    history.pushState(null, '', `#${id}`)
  }

  return (
    <nav
      aria-label="Section index"
      className="pointer-events-none fixed top-0 left-[calc(var(--rail-inset)_-_var(--spacing-rail))] z-40 hidden h-screen w-rail flex-col justify-center lg:flex"
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
                onClick={(e) => onLinkClick(e, s.id)}
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
                {/* Only visible on hover/focus, active section included —
                    it names itself while you're pointing at it, then goes
                    back to just the tick like every other stop. */}
                <span
                  className={cx(
                    'label absolute left-8 whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100',
                    on ? (onShade ? 'text-glint' : 'text-ink') : onShade ? 'text-glint-soft' : 'text-ink-soft',
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
