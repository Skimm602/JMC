'use client'

import { useEffect, useState } from 'react'
import { COMPANY } from '@/utils/company'
import { cx } from './ui.jsx'
import { ArrowRightIcon, PhoneIcon } from './icons.jsx'

/**
 * The way to buy, permanently in reach once the offer has been made.
 *
 * A floating capsule now rather than a full-width bar clamped to the bottom
 * edge. The page is built from tiles laid on a field, and a hard-edged band
 * pinned across the foot of it was the one element that belonged to a
 * different site — this is the same object as everything else, just the one
 * that follows you.
 *
 * It waits for the hero rather than appearing at load, because a call to
 * action shown before the offer is a pop-up. It hides again over the footer,
 * where the same two actions are already sitting in full.
 */
export default function StickyCta() {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const footer = document.getElementById('footer')

    const onScroll = () => {
      const pastHero = window.scrollY > window.innerHeight * 0.85
      const atFooter = footer ? footer.getBoundingClientRect().top < window.innerHeight : false
      setShown(pastHero && !atFooter)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const phone = COMPANY.phones[0]

  return (
    <div
      // Hidden from the tab order and the accessibility tree while it is off
      // screen: every control in here already exists in the footer, so a
      // keyboard user meeting the same two links twice is noise, not access.
      inert={!shown}
      aria-hidden={!shown}
      className={cx(
        // pointer-events-none on the strip at all times, not just when it is
        // hidden: this box spans the full width of the window, and anything
        // sitting in the bottom corners — the support launcher, most of all —
        // is underneath it. Only the capsule takes clicks.
        'pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 transition-[transform,opacity] duration-300 ease-out',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
      )}
    >
      <div
        className={cx(
          'bg-glare/90 flex w-full max-w-2xl items-center gap-3 rounded-full border border-white p-2 shadow-[0_20px_50px_-20px_rgba(15,31,64,0.6)] backdrop-blur-xl sm:gap-4 sm:pl-6',
          shown ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <p className="text-ink-soft hidden flex-1 text-sm leading-snug sm:block">
          Tell us what your bill looks like.{' '}
          <span className="text-navy-900 font-semibold">We will tell you what it could look like instead.</span>
        </p>

        <a
          href={`tel:${phone.replace(/\s/g, '')}`}
          className="text-navy-900 border-navy-900/15 hover:border-navy-900/50 hover:bg-sheet inline-flex h-11 flex-1 items-center justify-center gap-2.5 rounded-full border px-5 font-mono text-sm font-medium transition-colors duration-200 sm:flex-none"
        >
          <PhoneIcon className="text-solar-600 h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">{phone}</span>
          <span className="sm:hidden">Call</span>
        </a>

        <a
          href="/#footer"
          className="group/cta bg-navy-900 text-glare hover:bg-navy-800 inline-flex h-11 flex-1 items-center justify-center gap-2.5 rounded-full pr-1.5 pl-5 text-sm font-semibold transition-colors duration-200 sm:flex-none"
        >
          Free quote
          <span className="bg-solar-500 text-navy-950 grid h-8 w-8 shrink-0 place-items-center rounded-full transition-transform duration-200 group-hover/cta:translate-x-0.5">
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </span>
        </a>
      </div>
    </div>
  )
}
