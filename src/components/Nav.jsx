'use client'

import { useEffect, useState } from 'react'
import Logo from './Logo.jsx'
import { Button, cx } from './ui.jsx'
import { MenuIcon, XIcon } from './icons.jsx'

const links = [
  { label: 'Inverters', href: '#products' },
  { label: 'Sizing', href: '#sizing' },
  { label: 'Engineering', href: '#why' },
  { label: 'Installer program', href: '#installers' },
  { label: 'Support', href: '#footer' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  // The header starts transparent over the hero and only takes a surface
  // once you leave the fold — keeps the first impression uncluttered.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className={cx(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled ? 'border-rule bg-glare/90 border-b backdrop-blur-md' : 'border-b border-transparent',
      )}
    >
      {/* Same rail as every band below, so the logo sits on the page datum
          rather than at the viewport edge. The header used to go full-bleed
          at lg while the content column stayed centred, which is what put
          the logo and the hero headline on different axes above 1348px. */}
      <div className="rail">
        <div className="rail-inner flex h-nav items-center justify-between gap-6">
          <Logo />

          <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="group text-ink-soft hover:text-ink relative py-1 text-sm font-medium transition-colors"
              >
                {l.label}
                {/* the rule grows from the left, matching the button axis */}
                <span
                  aria-hidden="true"
                  className="bg-cool-600 absolute -bottom-0.5 left-0 h-px w-0 transition-all duration-300 ease-out group-hover:w-full"
                />
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <Button as="a" href="#register" variant="ghost" size="sm">
              Sign in
            </Button>
            <Button as="a" href="#register" size="sm">
              Create account
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-ink hover:text-ink-soft -mr-2 p-2 transition-colors lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile sheet. `inert` matters as much as the height here: collapsed,
          the sheet was still only visually hidden, so keyboard users tabbing
          off the logo landed in four invisible links and a CTA. */}
      <div
        id="mobile-nav"
        inert={!open}
        className={cx(
          'border-rule bg-glare/97 overflow-hidden border-t backdrop-blur-md transition-[max-height,opacity] duration-300 lg:hidden',
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <nav aria-label="Mobile" className="rail flex flex-col py-2">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="border-rule text-ink hover:text-ink-soft border-b py-4 text-sm font-medium transition-colors last:border-b-0"
            >
              {l.label}
            </a>
          ))}
          <Button as="a" href="#register" onClick={() => setOpen(false)} className="mt-4 mb-4 w-full">
            Create account
          </Button>
        </nav>
      </div>
    </header>
  )
}
