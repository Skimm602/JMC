'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * The thin amber bar the parent company's site shows while a page loads —
 * this site's own equivalent, without pulling in a router-events library:
 * the App Router's `next/navigation` no longer emits the events the old
 * Pages Router did, but a click on any same-origin, same-tab link is the one
 * signal that reliably precedes every real navigation, and a change in
 * `usePathname()` is the one signal that reliably follows it.
 *
 * The bar creeps toward 90% and never reaches 100% under its own steam —
 * finishing is tied to the pathname actually changing, not to a timer, so it
 * cannot claim a page is ready before it is.
 */
export default function RouteProgress() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const tickRef = useRef(null)
  const hideRef = useRef(null)

  // Pathname changed under an in-flight bar — the navigation this bar was
  // tracking has landed, so finish it rather than leaving it stalled at 90%.
  useEffect(() => {
    if (!visible) return
    clearInterval(tickRef.current)
    setProgress(100)
    hideRef.current = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 220)
    return () => clearTimeout(hideRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const anchor = e.target.closest('a')
      if (!anchor || !anchor.href || anchor.target === '_blank' || anchor.hasAttribute('download')) return

      let url
      try {
        url = new URL(anchor.href)
      } catch {
        return
      }

      // Only http(s) same-origin, same-path navigations count — a `tel:`
      // link, an external site, or a same-page `#anchor` scroll never fires
      // a pathname change for this bar to resolve against, and would leave
      // it stuck at 90% forever.
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname) return

      clearTimeout(hideRef.current)
      clearInterval(tickRef.current)
      setVisible(true)
      setProgress(15)
      tickRef.current = setInterval(() => {
        setProgress((p) => (p >= 90 ? p : p + (90 - p) * 0.12))
      }, 180)
    }

    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
      clearInterval(tickRef.current)
      clearTimeout(hideRef.current)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 200ms ease-out' }}
    >
      <div
        className="bg-solar-500 h-full shadow-[0_0_10px_#f59e0b,0_0_5px_#f59e0b]"
        style={{ width: `${progress}%`, transition: 'width 200ms ease-out' }}
      />
    </div>
  )
}
