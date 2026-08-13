'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { cx } from '../ui.jsx'
import { ArrowUpRightIcon, BoltIcon, FileIcon, MenuIcon, ShieldIcon, SpinnerIcon, WrenchIcon, XIcon } from '../icons.jsx'
import { adminSignOut } from '@/app/actions/admin'

/**
 * The back office's navigation.
 *
 * A rail rather than a bar: four destinations that get returned to constantly,
 * which is the case a persistent sidebar is for and a top bar is not. The
 * active row is a filled pill rather than an underline, so the answer to
 * "where am I" survives being glanced at.
 *
 * The pill and the rounding are softer than the marketing site's square
 * geometry on purpose. This is a tool someone sits in front of for an hour,
 * not a page that has to look like stamped equipment.
 */
const LINKS = [
  { href: '/admin', label: 'Verification', icon: ShieldIcon, hint: 'Installer applications' },
  { href: '/admin/orders', label: 'Orders', icon: FileIcon, hint: 'Approve and reject' },
  { href: '/admin/maintenance', label: 'Maintenance', icon: WrenchIcon, hint: 'Stock levels' },
  { href: '/admin/accounts', label: 'Accounts', icon: BoltIcon, hint: 'Users and admins' },
]

function NavList({ pathname, onNavigate, pending }) {
  return (
    <nav aria-label="Back office" className="grid gap-1">
      {LINKS.map(({ href, label, icon: Icon, hint }) => {
        // /admin would otherwise light up on every page below it.
        const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

        return (
          <a
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cx(
              'group flex items-center gap-3 rounded-[0.875rem] px-3.5 py-3 transition-colors duration-200',
              active ? 'bg-glint text-pit' : 'text-glint-soft hover:bg-glint/[0.08] hover:text-glint',
            )}
          >
            <Icon className={cx('h-[1.15rem] w-[1.15rem] shrink-0', active ? 'text-pit' : 'text-glint-soft')} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{label}</span>
              <span className={cx('mt-0.5 block text-[11px]', active ? 'text-pit/60' : 'text-glint-soft/70')}>
                {hint}
              </span>
            </span>
            {href === '/admin' && pending > 0 && (
              <span
                className={cx(
                  'label shrink-0 rounded-full px-2 py-0.5 tabular-nums',
                  active ? 'bg-pit/10 text-pit' : 'border-hot-400/50 text-hot-400 border',
                )}
              >
                {pending}
              </span>
            )}
          </a>
        )
      })}
    </nav>
  )
}

export default function AdminSidebar({ name, pending = 0 }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('idle')

  const signOut = async () => {
    setStatus('submitting')
    await adminSignOut()
    router.refresh()
    router.replace('/login')
  }

  const brand = (
    <div className="flex items-baseline gap-2">
      <span className="font-display display-wide bg-glint text-pit rounded-[0.5rem] px-2.5 py-1 text-[0.9375rem] leading-none font-bold tracking-[0.02em]">
        VIP
      </span>
      <span className="label text-glint-soft">Back office</span>
    </div>
  )

  /** The one way out. Everything else here is a page inside the back office;
      this is the only link that leaves it, so it gets its own row rather
      than blending into the destinations above. */
  const viewSite = (
    <a
      href="/"
      onClick={() => setOpen(false)}
      className="text-glint-soft hover:bg-glint/[0.08] hover:text-glint flex items-center gap-3 rounded-[0.875rem] px-3.5 py-2.5 text-sm transition-colors"
    >
      <ArrowUpRightIcon className="h-4 w-4 shrink-0" />
      View site
    </a>
  )

  const footer = (
    <div className="border-rule-shade border-t pt-4">
      <p className="text-glint-soft truncate px-1 text-xs">{name}</p>
      <button
        type="button"
        onClick={signOut}
        disabled={status === 'submitting'}
        className="text-glint-soft hover:bg-glint/[0.08] hover:text-glint mt-2 flex w-full items-center gap-2 rounded-[0.875rem] px-3.5 py-2.5 text-sm transition-colors disabled:opacity-60"
      >
        {status === 'submitting' && <SpinnerIcon className="h-4 w-4" />}
        {status === 'submitting' ? 'Signing out…' : 'Log out'}
      </button>
    </div>
  )

  return (
    <>
      {/* -------------------------------- mobile ------------------------------- */}
      <header className="band-pit border-rule-shade sticky top-0 z-40 flex h-14 items-center gap-4 border-b px-5 lg:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="admin-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="text-glint hover:text-glint-soft ml-auto p-2 transition-colors"
        >
          {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </header>

      <div
        id="admin-nav"
        inert={!open}
        className={cx(
          'band-pit border-rule-shade fixed inset-x-0 top-14 z-40 overflow-hidden border-b transition-[max-height,opacity] duration-300 lg:hidden',
          open ? 'max-h-[calc(100dvh-3.5rem)] overflow-y-auto opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="grid gap-4 p-4">
          {viewSite}
          <NavList pathname={pathname} pending={pending} onNavigate={() => setOpen(false)} />
          {footer}
        </div>
      </div>

      {/* ------------------------------- desktop ------------------------------- */}
      {/* Fixed rather than sticky: the tables to its right scroll for a long
          time, and a rail that leaves the screen is a rail you have to scroll
          back up to use. */}
      <aside className="band-pit border-rule-shade fixed inset-y-0 left-0 z-40 hidden w-[17rem] flex-col border-r p-5 lg:flex">
        <div className="px-1">{brand}</div>

        <div className="mt-8 mb-4">{viewSite}</div>

        <div className="flex-1">
          <NavList pathname={pathname} pending={pending} />
        </div>

        {footer}
      </aside>
    </>
  )
}
