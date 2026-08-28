'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from './Logo.jsx'
import { COMPANY } from '@/utils/company'
import LoginDialog from './LoginDialog.jsx'
import AccountMenu, { initialFor } from './AccountMenu.jsx'
import { signOut } from '@/app/actions/auth'
import { PRODUCT_CATEGORIES, categoryHref } from '@/utils/product-categories'
import { Button, cx } from './ui.jsx'
import { ArrowUpRightIcon, CartIcon, ChevronDownIcon, FileIcon, MenuIcon, SpinnerIcon, XIcon } from './icons.jsx'

/**
 * One list drives both the desktop bar and the mobile sheet, so the two can
 * never fall out of order. `dropdown` marks the entry that opens the product
 * menu instead of jumping straight to a section.
 *
 * The targets are root-relative rather than bare hashes: the bar is in the
 * layout now, so it also renders on /register, where `#sizing` would point at
 * a section that is not on the page. From home they still resolve to a
 * same-document scroll, so nothing about that behaviour changes.
 */
const links = [
  // '/#top' rather than '/': from the form it goes home, and from home it
  // scrolls back to the hero instead of doing nothing at all.
  { label: 'Home', href: '/#top' },
  // One control rather than a label plus a separate chevron beside it — the
  // whole thing is now the toggle. "Shop everything" inside the menu it opens
  // is what carries a visitor to the full catalogue instead.
  { label: 'Shop', dropdown: true },
  // The multi-brand range is the reason to buy here rather than from a
  // single-manufacturer importer, so it gets a place in the bar of its own.
  { label: 'Brands', href: '/#brands' },
  { label: 'Support', href: '/#footer' },
]

/**
 * Logging out from the mobile sheet. Its own component only because it needs
 * the pending state, and the sheet is not a place to leave a button that has
 * been pressed looking unpressed.
 */
function SignOutRow({ onDone }) {
  const router = useRouter()
  const [status, setStatus] = useState('idle')

  const leave = async () => {
    setStatus('signing-out')
    await signOut()
    onDone?.()
    router.refresh()
    router.push('/')
  }

  return (
    <button
      type="button"
      onClick={leave}
      disabled={status === 'signing-out'}
      className="text-ink-soft hover:text-navy-900 flex w-full items-center gap-2 py-4 text-left text-sm font-medium transition-colors disabled:opacity-60"
    >
      {status === 'signing-out' && <SpinnerIcon className="h-4 w-4" />}
      {status === 'signing-out' ? 'Logging out…' : 'Log out'}
    </button>
  )
}

/**
 * `user` comes from the layout, which reads the session on the server — the
 * bar renders signed-in on the first paint rather than flickering through a
 * logged-out state while a client-side check catches up.
 */
export default function Nav({ user = null, isAdmin = false, cartCount = 0 }) {
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

  // A closed sheet folds itself back up, so reopening it does not resume
  // half-way through somebody else's browse.
  useEffect(() => {
    if (!open) setMobileProducts(false)
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

  // Down from the trigger goes into the menu; up and down walk it. Without
  // this the menu is a tab stop that swallows three links.
  const onMenuKeyDown = (e, i) => {
    const step = { ArrowDown: 1, ArrowUp: -1 }[e.key]
    if (!step) return
    e.preventDefault()
    const next = (i + step + PRODUCT_CATEGORIES.length) % PRODUCT_CATEGORIES.length
    itemRefs.current[next]?.focus()
  }

  return (
    /* Clear at the top on every route — the page's ground is one continuous
       sky now, so there is nothing for the bar to be a different colour
       from. It takes a frosted surface only once that sky starts moving
       underneath it. */
    <header
      className={cx(
        // overflow-x-clip, not hidden: the shelf runs past the right edge on
        // purpose, and clip is the one that contains it without also cutting
        // off the product menu hanging below the bar.
        'fixed inset-x-0 top-0 z-50 overflow-x-clip transition-[background-color,backdrop-filter,box-shadow] duration-500',
        // The bar sits on the same sky the whole page is built on now, so at
        // the top it is genuinely nothing. Once the field starts moving under
        // it, it takes a frosted white surface and one soft shadow rather than
        // a border: a hairline over a gradient reads as a seam, a shadow reads
        // as the bar lifting off it. Every route is light, so there is no
        // longer a dark-page case to special-case.
        scrolled ? 'bg-glare/80 shadow-[0_10px_30px_-24px_rgba(15,31,64,0.65)] backdrop-blur-xl' : 'bg-transparent',
      )}
    >
      {/* Same rail as every band below, so the logo sits on the page datum
          rather than at the viewport edge. The header used to go full-bleed
          at lg while the content column stayed centred, which is what put
          the logo and the hero headline on different axes above 1348px. */}
      <div className="rail">
        <div className="rail-inner">
          <div className="flex h-nav items-center gap-6">
            {/* Mark, hairline, tagline — the reference's masthead. The
                tagline is the company's own, and it drops below xl rather
                than wrapping: a strapline that has to fold is noise. */}
            <div className="flex items-center gap-4">
              <Logo />
              <span aria-hidden="true" className="bg-navy-900/15 hidden h-8 w-px xl:block" />
              <span className="text-ink-soft hidden max-w-[11rem] text-xs leading-snug xl:block">
                {COMPANY.tagline}
              </span>
            </div>

            {/* The links sit as one group toward the action rather than spread
                across the bar: the eye runs logo → menu → the thing to press,
                and the empty span after the mark is what keeps the identity
                from being read as the first menu item. */}
            <nav aria-label="Main" className="mr-8 ml-auto hidden items-center gap-8 lg:flex">
              {links.map((l) =>
                !l.dropdown ? (
                  <a
                    key={l.href}
                    href={l.href}
                    className="group text-navy-900/75 hover:text-navy-900 relative py-1 text-sm font-medium transition-colors"
                  >
                    {l.label}
                    {/* the rule grows from the left, matching the button axis */}
                    <span
                      aria-hidden="true"
                      className="bg-solar-500 absolute -bottom-0.5 left-0 h-0.5 w-0 rounded-full transition-all duration-300 ease-out group-hover:w-full"
                    />
                  </a>
                ) : (
                  <div key={l.label} ref={productsRef} className="relative flex items-center">
                    {/* One control now, not a link plus a separate chevron
                        beside it — the press opens the menu, and the menu's
                        own "Shop everything" is the way through to
                        the full page. */}
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
                        products ? 'text-navy-900' : 'text-navy-900/75 hover:text-navy-900',
                      )}
                    >
                      {l.label}
                      <ChevronDownIcon
                        className={cx('h-3.5 w-3.5 transition-transform duration-200', products && 'rotate-180')}
                      />
                      <span
                        aria-hidden="true"
                        className="bg-solar-500 absolute -bottom-0.5 left-0 h-0.5 w-0 rounded-full transition-all duration-300 ease-out group-hover:w-full"
                      />
                    </button>

                    {products && (
                      <div
                        id="products-menu"
                        className="animate-reveal rounded-bento bg-glare absolute top-full left-0 z-10 mt-4 w-[19rem] overflow-hidden border border-white p-1.5 shadow-[0_24px_60px_-30px_rgba(15,31,64,0.7)]"
                      >
                        {/* Three destinations, not a catalogue. The menu's
                            job is to ask which kind of thing you came for
                            and then get out of the way — the models live on
                            the page it sends you to, where there is room to
                            show them properly. */}
                        {PRODUCT_CATEGORIES.map((c, i) => (
                          <a
                            key={c.key}
                            href={categoryHref(c)}
                            ref={(el) => {
                              itemRefs.current[i] = el
                            }}
                            onClick={() => setProducts(false)}
                            onKeyDown={(e) => onMenuKeyDown(e, i)}
                            className="hover:bg-sheet group/item rounded-card flex items-center gap-3 px-3.5 py-3 transition-colors"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="text-navy-900 group-hover/item:text-solar-600 block text-sm font-semibold transition-colors">
                                {c.label}
                              </span>
                              <span className="text-ink-soft mt-1 block text-xs leading-relaxed">{c.menuBlurb}</span>
                            </span>
                            <ChevronDownIcon
                              aria-hidden="true"
                              className="text-hush group-hover/item:text-solar-600 h-3.5 w-3.5 shrink-0 -rotate-90 transition-colors"
                            />
                          </a>
                        ))}

                        <a
                          href="/products"
                          onClick={() => setProducts(false)}
                          className="border-rule text-ink-soft hover:text-ink mt-1.5 flex items-center justify-between border-t px-3.5 py-3 text-xs font-medium transition-colors"
                        >
                          Shop everything
                          <span aria-hidden="true">→</span>
                        </a>
                      </div>
                    )}
                  </div>
                ),
              )}
            </nav>

            {/* The bar's actions. No dark shelf behind them any more: it
                existed to carry the pit ground down into a dark hero, and the
                hero is now a colour field beside a photograph, over both of
                which it hung as an unexplained tongue. */}
            <div className="relative hidden items-center gap-4 lg:flex">
              {/* Signed-in only, unlike the cart: an order history is a thing
                  you have, and offering it to somebody with no account is a
                  link to a log-in wall wearing a different name. */}
              {user && (
                <a
                  href="/account/orders"
                  aria-label="Your orders"
                  title="Your orders"
                  className="text-navy-900/70 hover:text-navy-900 relative p-2 transition-colors"
                >
                  <FileIcon className="h-5 w-5" />
                </a>
              )}

              {/* Visible whether signed in or not — a guest can still find
                  their way to /cart, which is where "log in to see it" lives. */}
              <a
                href="/cart"
                aria-label={cartCount > 0 ? `Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}` : 'Cart'}
                className="text-navy-900/70 hover:text-navy-900 relative p-2 transition-colors"
              >
                <CartIcon className="h-5 w-5" />
                {cartCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="bg-solar-500 text-navy-950 absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] leading-none font-bold"
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </a>

              {/* Signed in, the pair of buttons is replaced rather than added
                  to: "Log in" and "Create account" both ask for something that
                  has already happened. */}
              {user ? (
                <div className="relative">
                  <AccountMenu user={user} isAdmin={isAdmin} />
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative !text-navy-900/75 hover:!text-navy-900"
                    onClick={() => setLogin(true)}
                  >
                    Log in
                  </Button>
                  {/* The one amber thing in the bar, and the reference's only
                      filled control up here — so it has to be the thing the
                      business wants pressed. It used to say "Create account",
                      which asks a first-time visitor to sign up before they
                      have seen a single price. Signing up is still one click
                      away inside the log-in dialog and the mobile sheet. */}
                  <a
                    href="/products"
                    className="group/cta bg-solar-500 text-navy-950 hover:bg-solar-400 relative flex h-11 items-center gap-2.5 rounded-full px-5 text-sm font-semibold shadow-[0_10px_24px_-12px_rgba(245,158,11,0.95)] transition-colors duration-200"
                  >
                    Shop now
                    <ArrowUpRightIcon className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
                  </a>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="text-navy-900 border-navy-900/15 bg-glare/70 ml-auto grid h-11 w-11 place-items-center rounded-full border transition-colors lg:hidden"
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
          'bg-glare/97 border-t border-white/70 shadow-[0_20px_50px_-30px_rgba(15,31,64,0.7)] backdrop-blur-xl transition-[max-height,opacity] duration-300 lg:hidden',
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
                className="border-navy-900/10 text-navy-900 hover:text-solar-600 border-b py-4 text-sm font-semibold transition-colors"
              >
                {l.label}
              </a>
            ) : (
              <div key={l.label} className="border-navy-900/10 border-b">
                {/* One row, one control — the label and the chevron used to
                    be a separate link and a separate button; now the whole
                    row is the toggle, matching the bar above it. */}
                <button
                  type="button"
                  aria-expanded={mobileProducts}
                  onClick={() => setMobileProducts((v) => !v)}
                  className="text-navy-900 hover:text-solar-600 flex w-full items-center justify-between py-4 text-left text-sm font-semibold transition-colors"
                >
                  {l.label}
                  <ChevronDownIcon
                    className={cx('h-4 w-4 transition-transform duration-200', mobileProducts && 'rotate-180')}
                  />
                </button>

                {/* The same two levels as the bar, folded into an
                    accordion: a flyout has nowhere to fly to on a phone, and
                    one shelf open at a time keeps the sheet the length of a
                    thumb rather than the length of the range. */}
                {mobileProducts && (
                  <div className="animate-reveal pb-3">
                    {PRODUCT_CATEGORIES.map((c) => (
                      <a
                        key={c.key}
                        href={categoryHref(c)}
                        onClick={() => {
                          setOpen(false)
                          setMobileProducts(false)
                        }}
                        className="hover:bg-sheet rounded-card block px-2 py-3 transition-colors"
                      >
                        <span className="text-navy-900 block text-sm font-semibold">{c.label}</span>
                        <span className="text-ink-soft mt-0.5 block text-xs leading-relaxed">{c.menuBlurb}</span>
                      </a>
                    ))}

                    <a
                      href="/products"
                      onClick={() => {
                        setOpen(false)
                        setMobileProducts(false)
                      }}
                      className="text-ink-soft hover:text-navy-900 block px-2 py-3 text-xs font-medium transition-colors"
                    >
                      Shop everything →
                    </a>
                  </div>
                )}
              </div>
            ),
          )}

          <a
            href="/cart"
            onClick={() => setOpen(false)}
            className="border-navy-900/10 text-navy-900 hover:text-solar-600 flex items-center justify-between border-b py-4 text-sm font-semibold transition-colors"
          >
            Cart
            {cartCount > 0 && <span className="label text-ink-soft">{cartCount}</span>}
          </a>

          {/* The same swap as the bar. A dropdown inside a sheet that is
              already a dropdown would be a menu in a menu, so signed-in the
              sheet just lists the two destinations flat. */}
          {user ? (
            <div className="mt-4 mb-4">
              <div className="border-navy-900/10 flex items-center gap-3 border-b pb-4">
                <span
                  aria-hidden="true"
                  className="bg-navy-900 text-glare font-display grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold"
                >
                  {initialFor(user)}
                </span>
                <span className="min-w-0">
                  <span className="label text-ink-soft block">Signed in as</span>
                  <span className="text-navy-900 mt-0.5 block truncate text-sm">{user.email}</span>
                  {isAdmin && <span className="text-solar-600 mt-0.5 block text-xs font-medium">Admin</span>}
                </span>
              </div>

              {isAdmin && (
                <a
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="border-navy-900/10 text-navy-900 hover:text-solar-600 block border-b py-4 text-sm font-semibold transition-colors"
                >
                  Admin
                </a>
              )}

              <a
                href="/account/orders"
                onClick={() => setOpen(false)}
                className="border-navy-900/10 text-navy-900 hover:text-solar-600 block border-b py-4 text-sm font-semibold transition-colors"
              >
                Purchase history
              </a>

              <SignOutRow onDone={() => setOpen(false)} />
            </div>
          ) : (
            <>
              {/* Same order of priority as the bar: buy, then join, then
                  sign in. */}
              <Button
                as="a"
                variant="solar"
                size="lg"
                href="/products"
                onClick={() => setOpen(false)}
                className="mt-4 w-full"
              >
                Shop now
                <ArrowUpRightIcon className="h-4 w-4" />
              </Button>
              <Button
                as="a"
                variant="outline"
                size="lg"
                href="/register"
                onClick={() => setOpen(false)}
                className="mt-3 w-full"
              >
                Create account
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  setOpen(false)
                  setLogin(true)
                }}
                className="mt-3 mb-4 w-full"
              >
                Log in
              </Button>
            </>
          )}
        </nav>
      </div>

      <LoginDialog open={login} onClose={() => setLogin(false)} />
    </header>
  )
}
