'use client'

import { useEffect, useState } from 'react'
import Logo from './Logo.jsx'
import { Button, cx } from './ui.jsx'
import { MenuIcon, XIcon } from './icons.jsx'

const links = [
  { label: 'Inverters', href: '#products' },
  { label: 'Why JMC', href: '#why' },
  { label: 'Installer Program', href: '#installers' },
  { label: 'Support', href: '#footer' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  // The header starts transparent over the hero and only gains its surface
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
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'border-b border-ink-700/70 bg-ink-900/85 backdrop-blur-xl' : 'border-b border-transparent',
      )}
    >
      {/* padded at lg to sit on the same axis as the content, clearing the spine */}
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between gap-6 px-5 sm:px-8 lg:mx-0 lg:max-w-none lg:pr-10 lg:pl-[128px]">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-mute hover:text-chalk hover:bg-ink-800 rounded-md px-3.5 py-2 text-sm font-medium transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
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
          className="text-chalk hover:bg-ink-800 -mr-2 rounded-md p-2 lg:hidden"
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
          'border-ink-700 bg-ink-900/97 overflow-hidden border-t backdrop-blur-xl transition-[max-height,opacity] duration-300 lg:hidden',
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <nav aria-label="Mobile" className="flex flex-col gap-1 px-5 py-4">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-mute hover:bg-ink-800 hover:text-chalk rounded-md px-3 py-3 text-sm font-medium"
            >
              {l.label}
            </a>
          ))}
          <Button as="a" href="#register" onClick={() => setOpen(false)} className="mt-3 w-full">
            Create account
          </Button>
        </nav>
      </div>
    </header>
  )
}
