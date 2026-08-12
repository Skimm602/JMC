'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './ui.jsx'
import { Checkbox, Field, TextInput } from './form.jsx'
import { AlertIcon, SpinnerIcon } from './icons.jsx'
import { signIn } from '@/app/actions/auth'

/**
 * The one log-in form. The dialog in the header and the /login page both
 * render this, so there is a single place where credentials are validated and
 * a single place that can drift when the auth flow changes.
 *
 * `onDone` lets the dialog close itself once a session exists; the page passes
 * nothing and simply navigates.
 */
export default function LoginForm({ onDone, autoFocus = false }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState({})
  const [failure, setFailure] = useState('')
  const [status, setStatus] = useState('idle')
  const failureRef = useRef(null)

  // A rejected password is the one message on this form nobody may miss, so
  // focus goes to it rather than leaving it to be noticed.
  useEffect(() => {
    if (failure) failureRef.current?.focus()
  }, [failure])

  const onSubmit = async (event) => {
    event.preventDefault()

    const found = {}
    if (!email.trim()) found.email = 'Enter your email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) found.email = 'That address looks incomplete.'
    if (!password) found.password = 'Enter your password.'

    setErrors(found)
    if (Object.keys(found).length) {
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus())
      return
    }

    setFailure('')
    setStatus('submitting')

    const data = new FormData()
    data.set('email', email.trim())
    data.set('password', password)

    const result = await signIn(data)

    if (result?.error) {
      setFailure(result.error)
      setStatus('idle')
      return
    }

    // The session lives in a cookie the server just set, so the tree has to be
    // re-fetched rather than merely navigated — otherwise the page renders
    // from the cache it had while logged out.
    onDone?.()
    router.refresh()

    // Where you land is decided server-side, from the profile the server just
    // read: an admin goes to the back office, everyone else goes home. The
    // dialog in the header runs this same code, so logging in from the nav bar
    // takes an admin straight to work too.
    router.push(result?.redirectTo ?? '/')
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <fieldset disabled={status === 'submitting'} className="contents">
        <legend className="sr-only">Log in to your VIP account</legend>

        <div className="grid gap-5">
          <Field label="Email" required error={errors.email}>
            {(p) => (
              <TextInput
                {...p}
                type="email"
                value={email}
                autoFocus={autoFocus}
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
              className="text-ink-soft hover:text-ink border-b border-current/40 pb-px text-xs font-medium transition-colors hover:border-current"
            >
              Forgot password?
            </a>
          </div>
        </div>

        {failure && (
          <p
            ref={failureRef}
            tabIndex={-1}
            role="alert"
            className="border-hot-600/40 bg-hot-600/[0.06] text-ink animate-reveal mt-6 flex items-start gap-2.5 border px-3.5 py-3 text-xs leading-relaxed outline-none"
          >
            <AlertIcon className="text-hot-600 mt-px h-3.5 w-3.5 shrink-0" />
            {failure}
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
  )
}
