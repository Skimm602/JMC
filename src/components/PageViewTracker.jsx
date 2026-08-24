'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * Tells /api/track that a page was opened. Renders nothing.
 *
 * It lives in the browser rather than on the server on purpose. A server-side
 * count would tally every crawler, preview fetch and uptime check that ever
 * requests a URL; this only fires where there is a browser running scripts,
 * which is the closest cheap approximation of "a person looked at the site".
 *
 * sendBeacon rather than fetch: it hands the request to the browser and
 * returns, so a slow write can never hold up a page or be cancelled by the
 * visitor navigating away mid-flight. It also cannot report failure, which is
 * the right trade here — nothing on the page would do anything with the news.
 */
export default function PageViewTracker() {
  const pathname = usePathname()

  // Which path this component has already counted. React re-runs effects on
  // the StrictMode remount, and every client navigation runs this again, so
  // without the guard a single page open is worth two or three visits.
  const counted = useRef(null)

  useEffect(() => {
    if (counted.current === pathname) return
    counted.current = pathname

    // No body: the server reads the address and browser string off the
    // request itself, and would not trust anything sent from here anyway.
    navigator.sendBeacon?.('/api/track')
  }, [pathname])

  return null
}
