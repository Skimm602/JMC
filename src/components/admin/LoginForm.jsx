'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui.jsx'
import { Field, TextInput } from '../form.jsx'
import { AlertIcon, SpinnerIcon } from '../icons.jsx'
import { adminSignIn } from '@/app/actions/admin'

/**
 * Not a reuse of the site's LoginForm. That one lands you on the home page and
 * offers a "create one" link to anybody reading it; this one routes on whether
 * the account is actually an admin, and has nothing to offer someone who
 * arrived by guessing the URL.
 */
export default function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [failure, setFailure] = useState('')
  const [status, setStatus] = useState('idle')
  const failureRef = useRef(null)

  useEffect(() => {
    if (failure) failureRef.current?.focus()
  }, [failure])

  const onSubmit = async (event) => {
    event.preventDefault()

    const found = {}
    if (!email.trim()) found.email = 'Enter your email address.'
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

    const result = await adminSignIn(data)

    if (result?.error) {
      setFailure(result.error)
      setStatus('idle')
      return
    }

    // The session is a cookie the server just set, so the tree has to be
    // re-fetched rather than merely navigated — the gate on /admin runs on the
    // server and would otherwise read the logged-out render it already had.
    router.refresh()

    // A valid password on an account that is not an admin is still a valid
    // password. It buys the setup step, not the queue.
    router.replace(result.isAdmin ? '/admin' : '/admin/setup')
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <fieldset disabled={status === 'submitting'} className="contents">
        <legend className="sr-only">Log in to the back office</legend>

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
