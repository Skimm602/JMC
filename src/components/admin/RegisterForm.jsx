'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui.jsx'
import { Field, TextInput } from '../form.jsx'
import { AlertIcon, SpinnerIcon } from '../icons.jsx'
import { adminSignUp } from '@/app/actions/admin'

/**
 * Registering an admin.
 *
 * `requiresCode` is false only while the site has no admin at all, and in that
 * state the field is not merely hidden — the server is not asking for one
 * either. Rendering a code the page would then check itself would be theatre:
 * anyone who can read the form can read the code, so a code that arrives with
 * the form is no gate. The gate is that the window closes for good the moment
 * this form is used once.
 *
 * Once it has closed, the field appears and sits at the top rather than the
 * bottom — someone without a code should find that out before filling in a
 * password, not after.
 */
export default function AdminRegisterForm({ requiresCode }) {
  const router = useRouter()
  const [form, setForm] = useState({ code: '', fullName: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [failure, setFailure] = useState('')
  const [status, setStatus] = useState('idle')
  const failureRef = useRef(null)

  useEffect(() => {
    if (failure) failureRef.current?.focus()
  }, [failure])

  const set = (key) => (e) => {
    const { value } = e.target
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()

    const found = {}
    if (requiresCode && !form.code.trim()) found.code = 'Enter the setup code you were issued.'
    if (!form.fullName.trim()) found.fullName = 'Enter your full name.'
    if (!form.email.trim()) found.email = 'Enter your email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) found.email = 'That address looks incomplete.'
    if (form.password.length < 8) found.password = 'Use at least 8 characters.'
    if (form.confirm !== form.password) found.confirm = 'The two passwords do not match.'

    setErrors(found)
    if (Object.keys(found).length) {
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus())
      return
    }

    setFailure('')
    setStatus('submitting')

    const data = new FormData()
    if (requiresCode) data.set('setup_code', form.code.trim())
    data.set('full_name', form.fullName.trim())
    data.set('email', form.email.trim())
    data.set('password', form.password)

    const result = await adminSignUp(data)

    if (result?.error) {
      setFailure(result.error)
      setStatus('idle')
      return
    }

    router.refresh()

    // Both paths end at the site's own log-in page — there is one front door,
    // and it is the same one every customer uses. What happens after the
    // password is where admin and customer part: signIn() reads the profile and
    // sends an admin to /admin on its own.
    //
    // `granted: false` here means the code could not be spent yet (email
    // confirmation left the sign-up without a session), so that account logs in
    // as an ordinary one and finishes at /admin/setup.
    router.replace('/login?registered=1')
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <fieldset disabled={status === 'submitting'} className="contents">
        <legend className="sr-only">Register a back-office account</legend>

        <div className="grid gap-5">
          {requiresCode && (
            <Field
              label="Setup code"
              required
              error={errors.code}
              hint="Single use. Ask the existing admin — it is never sent by email."
            >
              {(p) => (
                <TextInput
                  {...p}
                  value={form.code}
                  autoFocus
                  onChange={set('code')}
                  placeholder="VIPS-000000-000000-000000"
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono"
                />
              )}
            </Field>
          )}

          <Field label="Full name" required error={errors.fullName}>
            {(p) => (
              <TextInput
                {...p}
                value={form.fullName}
                autoFocus={!requiresCode}
                onChange={set('fullName')}
                autoComplete="name"
              />
            )}
          </Field>

          <Field label="Email" required error={errors.email}>
            {(p) => (
              <TextInput {...p} type="email" value={form.email} onChange={set('email')} autoComplete="email" />
            )}
          </Field>

          <Field label="Password" required error={errors.password}>
            {(p) => (
              <TextInput
                {...p}
                type="password"
                value={form.password}
                onChange={set('password')}
                autoComplete="new-password"
              />
            )}
          </Field>

          <Field label="Confirm password" required error={errors.confirm}>
            {(p) => (
              <TextInput
                {...p}
                type="password"
                value={form.confirm}
                onChange={set('confirm')}
                autoComplete="new-password"
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
              Creating…
            </>
          ) : requiresCode ? (
            'Create admin account'
          ) : (
            'Create the first admin'
          )}
        </Button>
      </fieldset>
    </form>
  )
}
