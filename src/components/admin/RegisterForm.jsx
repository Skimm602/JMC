'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui.jsx'
import { Field, PasswordInput, TextInput } from '../form.jsx'
import { AlertIcon, SpinnerIcon } from '../icons.jsx'
import { adminSignUp } from '@/app/actions/admin'

/**
 * Registering the first admin.
 *
 * Nothing to enter but the account itself. The gate is not a secret typed into
 * this form — it is that the form only exists while the site has no admin, and
 * closes for good the moment it is used once. The page above refuses to render
 * it after that, and the server refuses the submission independently.
 */
export default function AdminRegisterForm() {
  const router = useRouter()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
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
    // `granted: false` here means the role could not be taken yet — email
    // confirmation left the sign-up without a session — so that account logs in
    // as an ordinary one and finishes at /admin/setup.
    router.replace('/login?registered=1')
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <fieldset disabled={status === 'submitting'} className="contents">
        <legend className="sr-only">Register a back-office account</legend>

        <div className="grid gap-5">
          <Field label="Full name" required error={errors.fullName}>
            {(p) => <TextInput {...p} value={form.fullName} autoFocus onChange={set('fullName')} autoComplete="name" />}
          </Field>

          <Field label="Email" required error={errors.email}>
            {(p) => (
              <TextInput {...p} type="email" value={form.email} onChange={set('email')} autoComplete="email" />
            )}
          </Field>

          <Field label="Password" required error={errors.password}>
            {(p) => (
              <PasswordInput
                {...p}
                value={form.password}
                onChange={set('password')}
                autoComplete="new-password"
              />
            )}
          </Field>

          <Field label="Confirm password" required error={errors.confirm}>
            {(p) => (
              <PasswordInput
                {...p}
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
          ) : (
            'Create the first admin'
          )}
        </Button>
      </fieldset>
    </form>
  )
}
