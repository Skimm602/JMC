'use client'

import { useEffect, useRef, useState } from 'react'
import Logo from './Logo.jsx'
import LoginDialog from './LoginDialog.jsx'
import { PRODUCT_NAV } from './Products.jsx'
import { Button, cx } from './ui.jsx'
import { ArrowUpRightIcon, ChevronDownIcon, MenuIcon, XIcon } from './icons.jsx'

/**
 * One list drives both the desktop bar and the mobile sheet, so the two can
 * never fall out of order. `dropdown` marks the entry that opens the product
 * menu instead of jumping straight to a section.
 */
const links = [
  { label: 'About', href: '#about' },
  { label: 'Products', dropdown: true },
  { label: 'Sizing', href: '#sizing' },
  { label: 'Engineering', href: '#why' },
  { label: 'Installer program', href: '#installers' },
  { label: 'Support', href: '#footer' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [login, setLogin] = useState(false)
  const [products, setProducts] = useState(false)
  const [mobileProducts, setMobileProducts] = useState(false)
  const productsRef = useRef(null)
  const triggerRef = useRef(null)
  const itemRefs = useRef([])
  const focusFirstRef = useRef(false)

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

  // A menu that stays open when you click elsewhere or scroll away reads as
  // stuck rather than open. Escape returns focus to the trigger, because that
  // is where a keyboard user was before the menu took it.
  useEffect(() => {
    if (!products) return

    const onPointerDown = (e) => {
      if (!productsRef.current?.contains(e.target)) setProducts(false)
    }
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return
      setProducts(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [products])

  // Focus has to wait for the menu to exist, and an effect is the only point
  // that is reliably after the commit — a rAF can land either side of it.
  useEffect(() => {
    if (products && focusFirstRef.current) itemRefs.current[0]?.focus()
    focusFirstRef.current = false
  }, [products])

  /**
   * Picking the family you are already on leaves the hash unchanged, so no
   * hashchange fires and the menu appears to do nothing. Saying so explicitly
   * keeps every item behaving the same way.
   */
  const goToFamily = (id) => {
    if (window.location.hash === `#product-${id}`) {
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    }
  }

  // Down from the trigger goes into the menu; up and down walk it. Without
  // this the menu is a tab stop that swallows five links.
  const onMenuKeyDown = (e, i) => {
    const step = { ArrowDown: 1, ArrowUp: -1 }[e.key]
    if (!step) return
    e.preventDefault()
    const next = (i + step + PRODUCT_NAV.length) % PRODUCT_NAV.length
    itemRefs.current[next]?.focus()
  }

  return (
    /* The bar is dark at every scroll position rather than fading up from
       transparent. It is the top edge of the dark ground the hero panel is
       inset into, so letting it go clear would detach it from the shape it
       belongs to. Scroll only deepens it and draws the rule. */
    <header
      className={cx(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled ? 'border-rule-shade bg-pit/95 border-b backdrop-blur-md' : 'bg-pit border-b border-transparent',
      )}
    >
      {/* Same rail as every band below, so the logo sits on the page datum
          rather than at the viewport edge. The header used to go full-bleed
          at lg while the content column stayed centred, which is what put
          the logo and the hero headline on different axes above 1348px. */}
      <div className="rail">
        <div className="rail-inner">
          <div className="flex h-nav items-center justify-between gap-6">
            <Logo tone="shade" />

            <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
              {links.map((l) =>
                !l.dropdown ? (
                  <a
                    key={l.href}
                    href={l.href}
                    className="group text-glint-soft hover:text-glint relative py-1 text-sm font-medium transition-colors"
                  >
                    {l.label}
                    {/* the rule grows from the left, matching the button axis */}
                    <span
                      aria-hidden="true"
                      className="bg-cool-400 absolute -bottom-0.5 left-0 h-px w-0 transition-all duration-300 ease-out group-hover:w-full"
                    />
                  </a>
                ) : (
                  <div key={l.label} ref={productsRef} className="relative">
                    <button
                      ref={triggerRef}
                      type="button"
                      aria-expanded={products}
                      aria-controls="products-menu"
                      onClick={() => setProducts((v) => !v)}
                      onKeyDown={(e) => {
                        if (e.key !== 'ArrowDown') return
                        e.preventDefault()
                        focusFirstRef.current = true
                        setProducts(true)
                      }}
                      className={cx(
                        'group relative flex items-center gap-1.5 py-1 text-sm font-medium transition-colors',
                        products ? 'text-glint' : 'text-glint-soft hover:text-glint',
                      )}
                    >
                      {l.label}
                      <ChevronDownIcon
                        className={cx('h-3.5 w-3.5 transition-transform duration-200', products && 'rotate-180')}
                      />
                      <span
                        aria-hidden="true"
                        className={cx(
                          'bg-cool-400 absolute -bottom-0.5 left-0 h-px transition-all duration-300 ease-out',
                          products ? 'w-full' : 'w-0 group-hover:w-full',
                        )}
                      />
                    </button>

                    {products && (
                      <div
                        id="products-menu"
                        className="animate-reveal border-rule bg-glare absolute top-full left-0 z-10 mt-4 w-[23rem] overflow-hidden rounded-[1.25rem] border p-1.5"
                      >
                        {PRODUCT_NAV.map((f, i) => {
                          const Icon = f.icon
                          return (
                            <a
                              key={f.id}
                              href={`#product-${f.id}`}
                              ref={(el) => {
                                itemRefs.current[i] = el
                              }}
                              onClick={() => {
                                setProducts(false)
                                goToFamily(f.id)
                              }}
                              onKeyDown={(e) => onMenuKeyDown(e, i)}
                              className="hover:bg-sheet group/item flex items-start gap-3.5 rounded-[0.875rem] px-3.5 py-3 transition-colors"
                            >
                              <Icon className="text-ink-soft group-hover/item:text-cool-600 mt-0.5 h-5 w-5 shrink-0 transition-colors" />
                              <span className="min-w-0">
                                <span className="label text-ink-soft block">{f.series}</span>
                                <span className="text-ink mt-1 block text-sm font-medium">{f.name}</span>
                                <span className="text-ink-soft mt-0.5 block text-xs">{f.tagline}</span>
                              </span>
                            </a>
                          )
                        })}

                        <a
                          href="#products"
                          onClick={() => setProducts(false)}
                          className="border-rule text-ink-soft hover:text-ink mt-1.5 flex items-center justify-between border-t px-3.5 py-3 text-xs font-medium transition-colors"
                        >
                          See the full range
                          <span aria-hidden="true">→</span>
                        </a>
                      </div>
                    )}
                  </div>
                ),
              )}
            </nav>

            {/* The action is a raised block on the bar rather than a bare
                label: it steps one surface up from the pit so it reads as the
                one thing in the row you can press, and the ringed arrow keeps
                the weight graphic instead of filling the whole pill with a
                pole colour that would then have to mean something. */}
            <div className="hidden items-center gap-4 lg:flex">
              <Button variant="ghostShade" size="sm" onClick={() => setLogin(true)}>
                Log in
              </Button>
              <a
                href="#register"
                className="group/cta bg-shade-raised hover:bg-shade-edge border-rule-shade hover:border-glint-soft/60 flex h-11 items-center gap-3 rounded-full border pr-1.5 pl-5 transition-colors duration-200"
              >
                <span className="text-glint text-sm font-medium">Create account</span>
                <span className="border-glint-soft/50 group-hover/cta:border-glint grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors duration-200">
                  <ArrowUpRightIcon className="text-glint h-4 w-4" />
                </span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="text-glint hover:text-glint-soft p-2 transition-colors lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              {open ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sheet. `inert` matters as much as the height here: collapsed,
          the sheet was still only visually hidden, so keyboard users tabbing
          off the logo landed in four invisible links and a CTA. */}
      <div
        id="mobile-nav"
        inert={!open}
        className={cx(
          'border-rule-shade bg-pit/97 border-t backdrop-blur-md transition-[max-height,opacity] duration-300 lg:hidden',
          // The product group can push the sheet past a fixed height, so it
          // scrolls once open rather than clipping the last link. Closed, it
          // still has to clip — that is what makes the collapse animate.
          open
            ? 'max-h-[calc(100dvh-var(--spacing-nav))] overflow-y-auto opacity-100'
            : 'max-h-0 overflow-hidden opacity-0',
        )}
      >
        <nav aria-label="Mobile" className="rail flex flex-col py-2">
          {links.map((l) =>
            !l.dropdown ? (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-rule-shade text-glint hover:text-glint-soft border-b py-4 text-sm font-medium transition-colors"
              >
                {l.label}
              </a>
            ) : (
              <div key={l.label} className="border-rule-shade border-b">
                <button
                  type="button"
                  aria-expanded={mobileProducts}
                  onClick={() => setMobileProducts((v) => !v)}
                  className="text-glint hover:text-glint-soft flex w-full items-center justify-between py-4 text-sm font-medium transition-colors"
                >
                  {l.label}
                  <ChevronDownIcon
                    className={cx('h-4 w-4 transition-transform duration-200', mobileProducts && 'rotate-180')}
                  />
                </button>

                {mobileProducts && (
                  <div className="animate-reveal pb-3">
                    {PRODUCT_NAV.map((f) => {
                      const Icon = f.icon
                      return (
                        <a
                          key={f.id}
                          href={`#product-${f.id}`}
                          onClick={() => {
                            setOpen(false)
                            setMobileProducts(false)
                            goToFamily(f.id)
                          }}
                          className="text-glint-soft hover:text-glint flex items-center gap-3 py-2.5 pl-3 text-sm transition-colors"
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {f.name}
                        </a>
                      )
                    })}
                  </div>
                )}
              </div>
            ),
          )}

          <Button as="a" href="#register" onClick={() => setOpen(false)} className="mt-4 w-full">
            Create account
            <ArrowUpRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outlineShade"
            onClick={() => {
              setOpen(false)
              setLogin(true)
            }}
            className="mt-3 mb-4 w-full"
          >
            Log in
          </Button>
        </nav>
      </div>

      <LoginDialog open={login} onClose={() => setLogin(false)} />
    </header>
  )
}
