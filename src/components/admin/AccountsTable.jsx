'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, cx } from '../ui.jsx'
import { AlertIcon, SpinnerIcon, XIcon } from '../icons.jsx'
import { deleteUserAccount, setAdmin } from '@/app/actions/admin'

const when = (iso) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const STATUS_TONE = {
  approved: 'border-cool-600/45 bg-cool-600/[0.07] text-cool-700',
  pending: 'border-rule-strong bg-sheet text-ink-soft',
  rejected: 'border-hot-600/45 bg-hot-600/[0.06] text-hot-700',
  not_required: 'border-rule bg-sheet/60 text-ink-soft',
}

function StatusChip({ status }) {
  return (
    <span className={cx('label inline-flex items-center border px-2 py-1', STATUS_TONE[status] ?? STATUS_TONE.pending)}>
      {String(status ?? 'unknown').replace('_', ' ')}
    </span>
  )
}

/* ------------------------------ delete dialog ----------------------------- */

/**
 * Deleting an account cannot be undone, so it asks — and asks with the name
 * in it, because "are you sure?" on its own is a button people learn to click
 * without reading.
 */
function DeleteConfirm({ account, onCancel, onDone }) {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const remove = async () => {
    setStatus('deleting')
    setError('')
    const result = await deleteUserAccount(account.id)
    if (result?.error) {
      setError(result.error)
      setStatus('idle')
      return
    }
    onDone()
  }

  return (
    <div className="border-hot-600/40 bg-hot-600/[0.05] animate-reveal border p-4">
      <p className="text-ink text-sm leading-relaxed">
        Delete <span className="font-medium">{account.full_name || 'this account'}</span>? Their profile, any
        verification they submitted and their log-in all go with it. This cannot be undone.
      </p>

      {error && (
        <p role="alert" className="text-hot-600 mt-3 flex items-start gap-1.5 text-xs leading-relaxed">
          <AlertIcon className="mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="hot" size="sm" onClick={remove} disabled={status === 'deleting'}>
          {status === 'deleting' ? (
            <>
              <SpinnerIcon className="h-3.5 w-3.5" />
              Deleting…
            </>
          ) : (
            'Delete permanently'
          )}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={status === 'deleting'}>
          Keep it
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------- admin toggle ----------------------------- */

function AdminToggle({ account, isSelf, onChanged }) {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  if (isSelf) return <span className="label text-ink-soft">you</span>

  const toggle = async () => {
    setStatus('working')
    setError('')
    const result = await setAdmin(account.id, !account.is_admin)
    setStatus('idle')
    if (result?.error) {
      setError(result.error)
      return
    }
    onChanged()
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={status === 'working'}
        className={cx(
          'label border-rule-strong text-ink-soft border px-2.5 py-1 transition-colors disabled:opacity-50',
          account.is_admin ? 'hover:border-hot-600 hover:text-hot-600' : 'hover:border-cool-600 hover:text-cool-600',
        )}
      >
        {status === 'working' ? 'Saving…' : account.is_admin ? 'Remove admin' : 'Make admin'}
      </button>
      {error && (
        <p role="alert" className="text-hot-600 mt-1.5 text-xs">
          {error}
        </p>
      )}
    </>
  )
}

/* --------------------------------- screen --------------------------------- */

export default function AccountsTable({ accounts, currentUserId }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(null)

  const refresh = () => {
    setConfirming(null)
    router.refresh()
  }

  return (
    <>
      <div className="border-rule bg-glare mt-8 overflow-x-auto border">
        <table className="w-full min-w-[52rem] border-collapse text-left">
          <thead>
            <tr className="border-rule border-b">
              {['Name', 'Company', 'Type', 'Verification', 'Registered', 'Back office', ''].map((head, i) => (
                <th key={i} className="label text-ink-soft px-4 py-3 font-medium">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-ink-soft px-4 py-12 text-center text-sm">
                  No accounts yet.
                </td>
              </tr>
            ) : (
              accounts.map((account) => {
                const isSelf = account.id === currentUserId

                return (
                  <tr key={account.id} className="border-rule border-b align-top last:border-b-0">
                    <td className="text-ink px-4 py-3 text-sm">
                      {account.full_name || '—'}
                      {account.is_admin && <span className="label text-cool-600 ml-2">admin</span>}
                      {confirming === account.id && (
                        <div className="mt-3 max-w-md">
                          <DeleteConfirm
                            account={account}
                            onCancel={() => setConfirming(null)}
                            onDone={refresh}
                          />
                        </div>
                      )}
                    </td>
                    <td className="text-ink-soft px-4 py-3 text-sm">{account.company_name || '—'}</td>
                    <td className="text-ink-soft px-4 py-3 text-sm">{account.customer_type}</td>
                    <td className="px-4 py-3">
                      <StatusChip status={account.verification_status} />
                    </td>
                    <td className="text-ink-soft px-4 py-3 font-mono text-xs">{when(account.created_at)}</td>
                    <td className="px-4 py-3">
                      <AdminToggle account={account} isSelf={isSelf} onChanged={refresh} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {/* No delete on your own row: the database refuses it, so
                          the button would only ever produce an error. */}
                      {!isSelf && confirming !== account.id && (
                        <button
                          type="button"
                          onClick={() => setConfirming(account.id)}
                          aria-label={`Delete ${account.full_name || 'this account'}`}
                          className="text-ink-soft hover:text-hot-600 p-1.5 transition-colors"
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-ink-soft mt-6 text-xs leading-relaxed">
        Deleting removes the log-in, the profile and any verification submitted. Documents already uploaded stay in the
        storage bucket — clear those from Storage → verification-docs if it matters.
      </p>
    </>
  )
}
