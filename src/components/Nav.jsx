'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from './Logo.jsx'
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
  // Pressing the label goes to the shop; the chevron beside it opens the
  // shortcut menu into the technical range on the home page. One control
  // could not do both without one of the two being a surprise.
  { label: 'Products', href: '/products', dropdown: true },
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
      className="text-glint-soft hover:text-glint flex w-full items-center gap-2 py-4 text-left text-sm font-medium transition-colors disabled:opacity-60"
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
    /* The bar is dark at every scroll position rather than fading up from
       transparent. It is the top edge of the dark ground the hero panel is
       inset into, so letting it go clear would detach it from the shape it
       belongs to. Scroll only deepens it and draws the rule. */
    <header
      className={cx(
        // overflow-x-clip, not hidden: the shelf runs past the right edge on
        // purpose, and clip is the one that contains it without also cutting
        // off the product menu hanging below the bar.
        'fixed inset-x-0 top-0 z-50 overflow-x-clip transition-colors duration-300',
        scrolled ? 'border-rule-shade bg-pit/95 border-b backdrop-blur-md' : 'bg-pit border-b border-transparent',
      )}
    >
      {/* Same rail as every band below, so the logo sits on the page datum
          rather than at the viewport edge. The header used to go full-bleed
          at lg while the content column stayed centred, which is what put
          the logo and the hero headline on different axes above 1348px. */}
      <div className="rail">
        <div className="rail-inner">
          <div className="flex h-nav items-center gap-6">
            <Logo tone="shade" />

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
                    className="group text-glint hover:text-glint-soft relative py-1 text-sm transition-colors"
                  >
                    {l.label}
                    {/* the rule grows from the left, matching the button axis */}
                    <span
                      aria-hidden="true"
                      className="bg-glint-soft absolute -bottom-0.5 left-0 h-px w-0 transition-all duration-300 ease-out group-hover:w-full"
                    />
                  </a>
                ) : (
                  <div key={l.label} ref={productsRef} className="relative flex items-center gap-1">
                    <a
                      href={l.href}
                      className="group text-glint hover:text-glint-soft relative py-1 text-sm transition-colors"
                    >
                      {l.label}
                      <span
                        aria-hidden="true"
                        className="bg-glint-soft absolute -bottom-0.5 left-0 h-px w-0 transition-all duration-300 ease-out group-hover:w-full"
                      />
                    </a>

                    {/* Its own control, with its own name: a chevron that is
                        part of the link would make "go to the shop" and "show
                        me the range" the same press. */}
                    <button
                      ref={triggerRef}
                      type="button"
                      aria-expanded={products}
                      aria-controls="products-menu"
                      aria-label="Product types"
                      onClick={() => setProducts((v) => !v)}
                      onKeyDown={(e) => {
                        if (e.key !== 'ArrowDown') return
                        e.preventDefault()
                        focusFirstRef.current = true
                        setProducts(true)
                      }}
                      className={cx(
                        'p-1 transition-colors',
                        products ? 'text-glint-soft' : 'text-glint hover:text-glint-soft',
                      )}
                    >
                      <ChevronDownIcon
                        className={cx('h-3.5 w-3.5 transition-transform duration-200', products && 'rotate-180')}
                      />
                    </button>

                    {products && (
                      <div
                        id="products-menu"
                        className="animate-reveal border-rule bg-glare absolute top-full left-0 z-10 mt-4 w-[19rem] overflow-hidden rounded-[1.25rem] border p-1.5"
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
                            className="hover:bg-sheet group/item flex items-center gap-3 rounded-[0.875rem] px-3.5 py-3 transition-colors"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="text-ink group-hover/item:text-cool-600 block text-sm font-medium transition-colors">
                                {c.label}
                              </span>
                              <span className="text-ink-soft mt-1 block text-xs leading-relaxed">{c.menuBlurb}</span>
                            </span>
                            <ChevronDownIcon
                              aria-hidden="true"
                              className="text-hush group-hover/item:text-cool-600 h-3.5 w-3.5 shrink-0 -rotate-90 transition-colors"
                            />
                          </a>
                        ))}

                        <a
                          href="/products"
                          onClick={() => setProducts(false)}
                          className="border-rule text-ink-soft hover:text-ink mt-1.5 flex items-center justify-between border-t px-3.5 py-3 text-xs font-medium transition-colors"
                        >
                          Everything, with prices
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
                  className="text-glint hover:text-glint-soft relative p-2 transition-colors"
                >
                  <FileIcon className="h-5 w-5" />
                </a>
              )}

              {/* Visible whether signed in or not — a guest can still find
                  their way to /cart, which is where "log in to see it" lives. */}
              <a
                href="/cart"
                aria-label={cartCount > 0 ? `Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}` : 'Cart'}
                className="text-glint hover:text-glint-soft relative p-2 transition-colors"
              >
                <CartIcon className="h-5 w-5" />
                {cartCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="bg-cool-600 text-glare absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] leading-none font-bold"
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
                  <Button variant="ghostShade" size="sm" className="relative" onClick={() => setLogin(true)}>
                    Log in
                  </Button>
                  <a
                    href="/register"
                    className="group/cta border-glint-soft/40 hover:border-glint relative flex h-11 items-center gap-3 rounded-full border pr-1.5 pl-5 transition-colors duration-200"
                  >
                    <span className="text-glint text-sm font-medium">Create account</span>
                    <span className="border-glint-soft/50 group-hover/cta:border-glint grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors duration-200">
                      <ArrowUpRightIcon className="text-glint h-4 w-4" />
                    </span>
                  </a>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="text-glint hover:text-glint-soft ml-auto p-2 transition-colors lg:hidden"
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
                <div className="flex items-center justify-between">
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="text-glint hover:text-glint-soft flex-1 py-4 text-sm font-medium transition-colors"
                  >
                    {l.label}
                  </a>
                  <button
                    type="button"
                    aria-expanded={mobileProducts}
                    aria-label="Product types"
                    onClick={() => setMobileProducts((v) => !v)}
                    className="text-glint hover:text-glint-soft p-3 transition-colors"
                  >
                    <ChevronDownIcon
                      className={cx('h-4 w-4 transition-transform duration-200', mobileProducts && 'rotate-180')}
                    />
                  </button>
                </div>

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
                        className="hover:bg-glint/[0.06] block rounded-[0.875rem] px-2 py-3 transition-colors"
                      >
                        <span className="text-glint block text-sm font-medium">{c.label}</span>
                        <span className="text-glint-soft mt-0.5 block text-xs leading-relaxed">{c.menuBlurb}</span>
                      </a>
                    ))}

                    <a
                      href="/products"
                      onClick={() => {
                        setOpen(false)
                        setMobileProducts(false)
                      }}
                      className="text-glint-soft hover:text-glint block px-2 py-3 text-xs font-medium transition-colors"
                    >
                      Everything, with prices →
                    </a>
                  </div>
                )}
              </div>
            ),
          )}

          <a
            href="/cart"
            onClick={() => setOpen(false)}
            className="border-rule-shade text-glint hover:text-glint-soft flex items-center justify-between border-b py-4 text-sm font-medium transition-colors"
          >
            Cart
            {cartCount > 0 && <span className="label text-glint-soft">{cartCount}</span>}
          </a>

          {/* The same swap as the bar. A dropdown inside a sheet that is
              already a dropdown would be a menu in a menu, so signed-in the
              sheet just lists the two destinations flat. */}
          {user ? (
            <div className="mt-4 mb-4">
              <div className="border-rule-shade flex items-center gap-3 border-b pb-4">
                <span
                  aria-hidden="true"
                  className="bg-glint text-pit font-display display-wide grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold"
                >
                  {initialFor(user)}
                </span>
                <span className="min-w-0">
                  <span className="label text-glint-soft block">Signed in as</span>
                  <span className="text-glint mt-0.5 block truncate text-sm">{user.email}</span>
                  {isAdmin && <span className="text-cool-400 mt-0.5 block text-xs font-medium">Admin</span>}
                </span>
              </div>

              {isAdmin && (
                <a
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="border-rule-shade text-glint hover:text-glint-soft block border-b py-4 text-sm font-medium transition-colors"
                >
                  Admin
                </a>
              )}

              <a
                href="/account/orders"
                onClick={() => setOpen(false)}
                className="border-rule-shade text-glint hover:text-glint-soft block border-b py-4 text-sm font-medium transition-colors"
              >
                Purchase history
              </a>

              <SignOutRow onDone={() => setOpen(false)} />
            </div>
          ) : (
            <>
              <Button as="a" href="/register" onClick={() => setOpen(false)} className="mt-4 w-full">
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
            </>
          )}
        </nav>
      </div>

      <LoginDialog open={login} onClose={() => setLogin(false)} />
    </header>
  )
}
