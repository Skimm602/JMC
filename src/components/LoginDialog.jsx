'use client'

import { useEffect, useId, useRef } from 'react'
import LoginForm from './LoginForm.jsx'
import { Eyebrow, cx } from './ui.jsx'
import { XIcon } from './icons.jsx'

/**
 * Logging in and opening an account are different errands. Registration is a
 * four-step application the whole page exists to funnel into, so it earns a
 * band of its own; coming back to an account you already have should not cost
 * a scroll away from whatever you were reading. So this one is a dialog, and
 * the page stays where it was underneath.
 *
 * Native <dialog> rather than a hand-rolled overlay: the focus trap, Esc, the
 * top layer and the inert page behind all come from the platform, and they
 * are the parts hand-rolled modals usually get wrong.
 */
export default function LoginDialog({ open, onClose }) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  // A modal dialog makes the page inert but not unscrollable — the backdrop
  // still passes the wheel through to the body behind it.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      // The panel fills the dialog box, so anything that lands on the dialog
      // itself came from the backdrop.
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className={cx(
        'bg-glare text-ink rounded-panel border-white shadow-[0_40px_80px_-40px_rgba(15,31,64,0.8)] m-auto w-[min(27rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] border p-0',
        'backdrop:bg-pit/70 backdrop:backdrop-blur-sm',
      )}
    >
      {/* Mounted only while open, so the form starts clean every time and the
          reveal actually plays. */}
      {open && <LoginPanel titleId={titleId} onClose={onClose} />}
    </dialog>
  )
}

function LoginPanel({ titleId, onClose }) {
  return (
    <div className="animate-reveal flex max-h-[calc(100dvh-2rem)] flex-col">
      <div className="border-rule flex items-start justify-between gap-6 border-b px-7 py-6">
        <div>
          <Eyebrow>Account access</Eyebrow>
          <h2 id={titleId} className="display-wide text-display-3 mt-3 font-semibold">
            Log in
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-ink-soft hover:text-ink -mt-1 -mr-2 shrink-0 p-2 transition-colors"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Same form as /login, so a fix to either one is a fix to both. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-7 py-7">
        <LoginForm autoFocus onDone={onClose} />
      </div>

      <div className="border-rule text-ink-soft border-t px-7 py-5 text-sm">
        No account yet?{' '}
        <a
          href="/register"
          onClick={onClose}
          className="text-ink border-b border-current/40 pb-px font-medium transition-colors hover:border-current"
        >
          Create one
        </a>
      </div>
    </div>
  )
}
