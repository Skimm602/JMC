'use client'

import { useEffect, useState } from 'react'
import { COMPANY } from '@/utils/company'
import { cx } from './ui.jsx'
import { ArrowUpRightIcon, PhoneIcon } from './icons.jsx'

/**
 * The way to buy, permanently in reach once the offer has been made.
 *
 * On a page whose only job is to sell, the action cannot live only in the
 * first viewport and the footer: a visitor deep in the reviews who decides
 * right then has to scroll somewhere to act, and some of them will not. This
 * rides at the bottom of the screen from the moment the hero leaves it.
 *
 * It waits for the hero rather than appearing at load, because a call to
 * action shown before the offer is a pop-up. It hides again over the footer,
 * where the same two actions are already sitting in full — a bar covering the
 * thing it duplicates is just an obstruction.
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
        'fixed inset-x-0 bottom-0 z-40 transition-[transform,opacity] duration-300 ease-out',
        shown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0',
      )}
    >
      <div className="border-rule-shade bg-pit/95 border-t backdrop-blur-md">
        <div className="rail">
          <div className="rail-inner flex items-center gap-4 py-3">
            <p className="text-glint-soft hidden flex-1 text-sm leading-snug sm:block">
              Tell us what your bill looks like.{' '}
              <span className="text-glint font-medium">We will tell you what it could look like instead.</span>
            </p>

            <div className="flex flex-1 items-center gap-3 sm:flex-none">
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="text-glint border-glint-soft/40 hover:border-glint hover:bg-glint/[0.06] inline-flex h-11 flex-1 items-center justify-center gap-2.5 rounded-full border px-5 font-mono text-sm font-medium transition-colors duration-200 sm:flex-none"
              >
                <PhoneIcon className="text-solar-400 h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{phone}</span>
                <span className="sm:hidden">Call</span>
              </a>

              <a
                href="/#footer"
                className="bg-solar-500 text-navy-950 hover:bg-solar-400 inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold shadow-[0_0_0_0_rgba(245,158,11,0.5)] transition-[background-color,box-shadow] duration-300 hover:shadow-[0_0_20px_1px_rgba(245,158,11,0.5)] sm:flex-none"
              >
                Get a free quote
                <ArrowUpRightIcon className="h-4 w-4 shrink-0" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
