'use client'

import { useEffect, useRef, useState } from 'react'
import { cx } from './ui.jsx'

/**
 * The "fades up into place as you scroll" motion running through the parent
 * company's own site — every content block there ships an inline
 * `opacity:0;transform:translateY(40px)` at first paint and a script clears
 * it once the block enters view. Built here with IntersectionObserver rather
 * than this page's old `.reveal-up` (an `animation-timeline: view()` CSS
 * animation): that one only runs in Chromium — Safari and Firefox never saw
 * the guard's `@supports` block pass, so the content just sat still. This
 * runs in every browser, the same way the reference site's does.
 *
 * Reveals once and stays revealed. Scrolling a card back into view and
 * having it fade in *again* would read as the page glitching, not as polish.
 *
 * `delay` staggers a run of siblings — pass the index's `i * 70`-style offset
 * from a `.map()` so a row of cards settles in sequence rather than at once.
 */
export default function Reveal({ children, as: Tag = 'div', className, delay = 0, ...rest }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setShown(true)
        observer.disconnect()
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : '0ms' }}
      className={cx(
        'transition-[opacity,transform,filter] duration-700 ease-out',
        shown ? 'translate-y-0 opacity-100 blur-none' : 'translate-y-6 opacity-0 blur-sm',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}
