'use client'

import { useEffect, useState } from 'react'
import Logo from './Logo.jsx'
import { Button, cx } from './ui.jsx'
import { MenuIcon, XIcon } from './icons.jsx'

const links = [
  { label: 'Inverters', href: '#products' },
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
        scrolled ? 'border-ink/12 bg-glare/90 border-b backdrop-blur-md' : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between gap-6 px-5 sm:px-8 lg:mx-0 lg:max-w-none lg:pr-10 lg:pl-[128px]">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group text-ink-soft hover:text-ink relative py-1 text-sm font-medium transition-colors"
            >
              {l.label}
              {/* the rule heats up and grows from the left, matching the button axis */}
              <span
                aria-hidden="true"
                className="bg-hot-600 absolute -bottom-0.5 left-0 h-px w-0 transition-all duration-300 ease-out group-hover:w-full"
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
          className="text-ink hover:text-hot-600 -mr-2 p-2 transition-colors lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile sheet */}
      <div
        id="mobile-nav"
        className={cx(
          'border-ink/12 bg-glare/97 overflow-hidden border-t backdrop-blur-md transition-[max-height,opacity] duration-300 lg:hidden',
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <nav aria-label="Mobile" className="flex flex-col px-5 py-2">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="border-ink/10 text-ink hover:text-hot-600 border-b py-4 text-sm font-medium transition-colors last:border-b-0"
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
