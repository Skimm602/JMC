'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cx } from './ui.jsx'
import { ChevronDownIcon, FileIcon, SpinnerIcon } from './icons.jsx'
import { signOut } from '@/app/actions/auth'

/**
 * The initial the avatar shows. The email is the one thing every account
 * definitely has — a profile row can exist with a blank name, and an avatar
 * that renders "?" for those would be the account's first impression of itself.
 */
export function initialFor(user) {
  const source = user?.email || user?.user_metadata?.full_name || '?'
  return source.trim().charAt(0).toUpperCase()
}

/**
 * The signed-in half of the header.
 *
 * It replaces Log in / Create account rather than sitting beside them: those
 * two ask for something that has already happened, and leaving them up is how
 * a header ends up telling a logged-in customer to make a second account.
 */
export default function AccountMenu({ user }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('idle')
  const wrapRef = useRef(null)
  const triggerRef = useRef(null)

  // A menu that stays open when you click elsewhere reads as stuck rather than
  // open. Escape returns focus to the trigger, because that is where a
  // keyboard user was before the menu took it.
  useEffect(() => {
    if (!open) return

    const onPointerDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const leave = async () => {
    setStatus('signing-out')
    await signOut()
    setOpen(false)
    // The session is a cookie the server just cleared, so the tree has to be
    // re-fetched rather than merely navigated.
    router.refresh()
    router.push('/')
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={() => setOpen((v) => !v)}
        className="group/acct border-glint-soft/40 hover:border-glint flex h-11 items-center gap-2.5 rounded-full border py-1.5 pr-3 pl-1.5 transition-colors duration-200"
      >
        <span
          aria-hidden="true"
          className="bg-glint text-pit font-display display-wide grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold"
        >
          {initialFor(user)}
        </span>
        <span className="sr-only">Your account — {user?.email}</span>
        <ChevronDownIcon
          className={cx('text-glint h-3.5 w-3.5 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          id="account-menu"
          className="animate-reveal border-rule bg-glare absolute top-full right-0 z-10 mt-4 w-[17rem] overflow-hidden rounded-[1.25rem] border p-1.5"
        >
          <div className="border-rule border-b px-3.5 pt-2.5 pb-3">
            <p className="label text-ink-soft">Signed in as</p>
            <p className="text-ink mt-1.5 truncate text-sm font-medium">{user?.email}</p>
          </div>

          <a
            href="/account/orders"
            onClick={() => setOpen(false)}
            className="hover:bg-sheet group/item mt-1.5 flex items-center gap-3 rounded-[0.875rem] px-3.5 py-3 transition-colors"
          >
            <FileIcon className="text-cool-600 h-4 w-4 shrink-0" />
            <span className="min-w-0">
              <span className="text-ink block text-sm font-medium">Purchase history</span>
              <span className="text-ink-soft mt-0.5 block text-xs">Pending, delivered and cancelled</span>
            </span>
          </a>

          <button
            type="button"
            onClick={leave}
            disabled={status === 'signing-out'}
            className="hover:bg-sheet text-ink-soft hover:text-ink border-rule mt-1.5 flex w-full items-center gap-3 border-t px-3.5 py-3 text-left text-sm transition-colors disabled:opacity-60"
          >
            {status === 'signing-out' && <SpinnerIcon className="h-4 w-4" />}
            {status === 'signing-out' ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      )}
    </div>
  )
}
