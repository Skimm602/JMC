'use client'

import { useState } from 'react'
import LoginForm from './LoginForm.jsx'
import { cx } from './ui.jsx'

/** How long the current takes to run the border, in ms. Matches .animate-trace. */
const TRACE_MS = 720

/**
 * The log-in card, and the one bit of theatre on it.
 *
 * An accepted password sends a short bright segment one lap of the card's
 * border and into the button, then the card gives way to the page being
 * navigated to. It is the same idea as the energy-flow diagram in the range
 * section — current travelling down a conductor — which is why it is drawn
 * with the same mechanism rather than a new one: a gap in a dash pattern
 * moving along a path.
 *
 * It plays on success only. A rejected password has a message to read, and
 * running a celebration underneath it would be the wrong thing twice.
 *
 * The card had to become a client component to hold this, so the page still
 * owns everything above and below the form — only the bordered box moved.
 */
export default function LoginCard({ children, footer }) {
  const [live, setLive] = useState(false)

  /**
   * LoginForm awaits this before it navigates, so the lap actually finishes
   * rather than being cut off by the route change a few milliseconds in.
   *
   * Anyone who has asked for less motion gets none of it and no wait either —
   * the CSS would already have collapsed the animation to nothing, and pausing
   * three quarters of a second for an animation that is not playing is just a
   * slow log-in.
   */
  const play = () =>
    new Promise((resolve) => {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return resolve()
      setLive(true)
      setTimeout(resolve, TRACE_MS + 180)
    })

  return (
    <div className={cx('relative', live && 'animate-lift-away')}>
      <div className="border-rule bg-glare corner-ticks text-ink border p-6 sm:p-9">
        {children}

        <LoginForm autoFocus onSuccess={play} />

        {footer}
      </div>

      {/* The conductor. Drawn over the card rather than as its border, because
          a border cannot carry a moving dash — and inset by half the stroke so
          the line sits on the edge instead of straddling it.

          pathLength="1" normalises the perimeter, so dasharray and offset are
          fractions of a lap and the timing does not change with the card's
          height. */}
      {live && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <rect
            x="0.75"
            y="0.75"
            width="calc(100% - 1.5px)"
            height="calc(100% - 1.5px)"
            fill="none"
            pathLength="1"
            strokeWidth="1.5"
            strokeDasharray="0.16 0.84"
            className="stroke-cool-500 animate-trace"
          />
          {/* A second, shorter segment just behind the first: the head reads as
              bright and the tail as afterglow, which is what makes it look like
              something travelling rather than a dash being redrawn. */}
          <rect
            x="0.75"
            y="0.75"
            width="calc(100% - 1.5px)"
            height="calc(100% - 1.5px)"
            fill="none"
            pathLength="1"
            strokeWidth="3"
            strokeDasharray="0.05 0.95"
            className="stroke-cool-400 animate-trace opacity-70 blur-[2px]"
          />
        </svg>
      )}
    </div>
  )
}
