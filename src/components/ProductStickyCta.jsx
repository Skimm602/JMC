'use client'

import { useEffect, useState } from 'react'
import { cx } from './ui.jsx'
import { ArrowRightIcon } from './icons.jsx'

/**
 * The way to buy, permanently in reach on a phone.
 *
 * Below `lg` the order form sits in normal document flow after the
 * description and specification table rather than beside them — see the
 * grid in products/[id]/page.jsx. A long datasheet on one product can put
 * real scrolling between "I want this" and the first input field. This is
 * the same fix the home page's StickyCta already uses for the same problem
 * at page scale: follow the visitor until the real thing is back in view,
 * then get out of the way.
 *
 * lg:hidden because above that breakpoint the order form is lg:sticky and
 * already stays in view on its own — a second floating CTA there would be
 * redundant with the one already on screen.
 */
export default function ProductStickyCta({ targetId }) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const target = document.getElementById(targetId)

    const onScroll = () => {
      const pastTop = window.scrollY > window.innerHeight * 0.6
      const atTarget = target ? target.getBoundingClientRect().top < window.innerHeight * 0.5 : false
      setShown(pastTop && !atTarget)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [targetId])

  return (
    <div
      // Hidden from the tab order and the accessibility tree while it is off
      // screen — the same real "Order now" control is already reachable in
      // the form itself, so a keyboard user meeting it twice is noise.
      inert={!shown}
      aria-hidden={!shown}
      className={cx(
        'pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 transition-[transform,opacity] duration-300 ease-out lg:hidden',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
      )}
    >
      <a
        href={`#${targetId}`}
        className={cx(
          'group/cta bg-navy-900 text-glare hover:bg-navy-800 flex w-full max-w-md items-center justify-center gap-2.5 rounded-full border border-white p-2 pl-5 text-sm font-semibold shadow-[0_20px_50px_-20px_rgba(15,31,64,0.6)] backdrop-blur-xl transition-colors duration-200',
          shown ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        Order this unit
        <span className="bg-solar-500 text-navy-950 grid h-8 w-8 shrink-0 place-items-center rounded-full transition-transform duration-200 group-hover/cta:translate-x-0.5">
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </span>
      </a>
    </div>
  )
}
