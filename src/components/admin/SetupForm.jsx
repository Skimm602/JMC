'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui.jsx'
import { AlertIcon, SpinnerIcon } from '../icons.jsx'
import { claimFirstAdmin } from '@/app/actions/admin'

/**
 * The half-step: a real session on an account that is not an admin yet, on a
 * site that has no admin at all.
 *
 * Reached two ways — the owner logging in with the account they already have
 * rather than making a second one to hold the role, and a sign-up that could
 * not finish because email confirmation left it without a session.
 *
 * There is nothing to type. The page above only renders this while the window
 * is open, and the database closes the window on the first press.
 */
export default function AdminSetupForm() {
  const router = useRouter()
  const [failure, setFailure] = useState('')
  const [status, setStatus] = useState('idle')
  const failureRef = useRef(null)

  useEffect(() => {
    if (failure) failureRef.current?.focus()
  }, [failure])

  const onSubmit = async (event) => {
    event.preventDefault()

    setFailure('')
    setStatus('submitting')

    const result = await claimFirstAdmin()

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

        {failure && (
          <p
            ref={failureRef}
            tabIndex={-1}
            role="alert"
            className="border-hot-600/40 bg-hot-600/[0.06] text-ink animate-reveal mb-6 flex items-start gap-2.5 border px-3.5 py-3 text-xs leading-relaxed outline-none"
          >
            <AlertIcon className="text-hot-600 mt-px h-3.5 w-3.5 shrink-0" />
            {failure}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={status === 'submitting'}>
          {status === 'submitting' ? (
            <>
              <SpinnerIcon className="h-4 w-4" />
              Claiming…
            </>
          ) : (
            'Take admin access'
          )}
        </Button>
      </fieldset>
    </form>
  )
}
