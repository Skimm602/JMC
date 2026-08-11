'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Button, Eyebrow, cx } from './ui.jsx'
import { Checkbox, Field, TextInput } from './form.jsx'
import { AlertIcon, SpinnerIcon, XIcon } from './icons.jsx'

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
        'bg-glare text-ink border-rule m-auto w-[min(27rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] border p-0',
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  const noticeRef = useRef(null)

  useEffect(() => {
    if (status === 'notice') noticeRef.current?.focus()
  }, [status])

  const onSubmit = (event) => {
    event.preventDefault()
    const found = {}
    if (!email.trim()) found.email = 'Enter your email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) found.email = 'That address looks incomplete.'
    if (!password) found.password = 'Enter your password.'

    setErrors(found)
    if (Object.keys(found).length) {
      requestAnimationFrame(() => document.querySelector('dialog[open] [aria-invalid="true"]')?.focus())
      return
    }

    setStatus('submitting')
    setTimeout(() => setStatus('notice'), 900)
  }

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

      <form onSubmit={onSubmit} className="min-h-0 flex-1 overflow-y-auto px-7 py-7">
        <fieldset disabled={status === 'submitting'} className="contents">
          <legend className="sr-only">Log in to your VIP account</legend>

          <div className="grid gap-5">
            <Field label="Email" required error={errors.email}>
              {(p) => (
                <TextInput
                  {...p}
                  type="email"
                  value={email}
                  autoFocus
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                  }}
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              )}
            </Field>

            <Field label="Password" required error={errors.password}>
              {(p) => (
                <TextInput
                  {...p}
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
                  }}
                  autoComplete="current-password"
                />
              )}
            </Field>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <Checkbox checked={remember} onChange={setRemember} label="Keep me logged in" name="remember" />
              <a
                href="/#footer"
                onClick={onClose}
                className="text-ink-soft hover:text-ink border-b border-current/40 pb-px text-xs font-medium transition-colors hover:border-current"
              >
                Forgot password?
              </a>
            </div>
          </div>

          {/* Nothing is authenticating yet, so the form says so instead of
              faking a session. Same posture as the sizing panel. */}
          {status === 'notice' && (
            <p
              ref={noticeRef}
              tabIndex={-1}
              role="status"
              className="border-rule bg-sheet text-ink-soft animate-reveal mt-6 flex items-start gap-2.5 border px-3.5 py-3 text-xs leading-relaxed"
            >
              <AlertIcon className="mt-px h-3.5 w-3.5 shrink-0" />
              Account services are not connected yet. Registered installers will be emailed as soon as log-in opens.
            </p>
          )}

          <Button type="submit" size="lg" className="mt-7 w-full" disabled={status === 'submitting'}>
            {status === 'submitting' ? (
              <>
                <SpinnerIcon className="h-4 w-4" />
                Checking…
              </>
            ) : (
              'Log in'
            )}
          </Button>
        </fieldset>
      </form>

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
