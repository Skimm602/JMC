'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui.jsx'
import { Field, TextInput } from '../form.jsx'
import { AlertIcon, SpinnerIcon } from '../icons.jsx'
import { claimFirstAdmin, redeemAdminCode } from '@/app/actions/admin'

/**
 * The half-step: a real session on an account that is not an admin yet.
 *
 * Reached three ways — the owner logging in with the account they already have
 * on the site and taking the role, a second admin being added later, and a
 * sign-up that could not finish because email confirmation left it without a
 * session.
 *
 * `requiresCode` is false only while the site has no admin at all, and then
 * this is one button. Showing that button to whoever else wanders in during
 * that window is the same exposure /admin/register already has, and it closes
 * the same way: the first person through shuts it behind them.
 */
export default function AdminSetupForm({ requiresCode }) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [failure, setFailure] = useState('')
  const [status, setStatus] = useState('idle')
  const failureRef = useRef(null)

  useEffect(() => {
    if (failure) failureRef.current?.focus()
  }, [failure])

  const onSubmit = async (event) => {
    event.preventDefault()

    if (requiresCode && !code.trim()) {
      setError('Enter your setup code.')
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus())
      return
    }

    setError('')
    setFailure('')
    setStatus('submitting')

    let result
    if (requiresCode) {
      const data = new FormData()
      data.set('setup_code', code.trim())
      result = await redeemAdminCode(data)
    } else {
      result = await claimFirstAdmin()
    }

    if (result?.error) {
      setFailure(result.error)
      setStatus('idle')
      return
    }

    router.refresh()
    router.replace('/admin')
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <fieldset disabled={status === 'submitting'} className="contents">
        <legend className="sr-only">Take admin access on this account</legend>

        {requiresCode && (
          <Field label="Setup code" required error={error}>
            {(p) => (
              <TextInput
                {...p}
                value={code}
                autoFocus
                onChange={(e) => {
                  setCode(e.target.value)
                  if (error) setError('')
                }}
                placeholder="VIPS-000000-000000-000000"
                autoComplete="off"
                spellCheck={false}
                className="font-mono"
              />
            )}
          </Field>
        )}

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

        <Button
          type="submit"
          size="lg"
          className={requiresCode ? 'mt-7 w-full' : 'w-full'}
          disabled={status === 'submitting'}
        >
          {status === 'submitting' ? (
            <>
              <SpinnerIcon className="h-4 w-4" />
              {requiresCode ? 'Checking…' : 'Claiming…'}
            </>
          ) : requiresCode ? (
            'Redeem code'
          ) : (
            'Take admin access'
          )}
        </Button>
      </fieldset>
    </form>
  )
}
