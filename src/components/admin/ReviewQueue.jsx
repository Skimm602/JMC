'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Rule, cx } from '../ui.jsx'
import { AlertIcon, CheckIcon, FileIcon, ShieldIcon, SpinnerIcon } from '../icons.jsx'
import {
  approveVerification,
  getPendingVerifications,
  getSignedDocUrl,
  rejectVerification,
} from '@/app/actions/verification'

/* --------------------------------- helpers -------------------------------- */

const when = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

const waitingSince = (iso) => {
  if (!iso) return '—'
  const days = Math.floor((Date.now() - new Date(iso)) / 86_400_000)
  if (days < 1) return 'today'
  return days === 1 ? '1 day' : `${days} days`
}

/** The status a profile is actually in, in the palette's own terms. */
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

/* ------------------------------ document link ----------------------------- */

/**
 * The bucket is private and stays private: the admin gets a five-minute signed
 * URL, minted per click, rather than the page holding a set of live links to
 * other people's licences for as long as it is open.
 *
 * The tab is opened synchronously and pointed afterwards. Opening it once the
 * signed URL has come back would be a popup, and would be blocked.
 */
function DocumentLink({ label, path }) {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  if (!path) {
    return (
      <span className="border-rule text-ink-soft flex items-center gap-2.5 border border-dashed px-3.5 py-3 text-xs">
        <FileIcon className="h-4 w-4 shrink-0 opacity-50" />
        {label} — not provided
      </span>
    )
  }

  const open = async () => {
    const tab = window.open('', '_blank', 'noopener,noreferrer')
    setStatus('loading')
    setError('')

    const result = await getSignedDocUrl(path)
    setStatus('idle')

    if (result?.error || !result?.url) {
      tab?.close()
      setError(result?.error || 'Could not open that document.')
      return
    }

    if (tab) tab.location = result.url
    else window.location.href = result.url
  }

  return (
    <div>
      <button
        type="button"
        onClick={open}
        disabled={status === 'loading'}
        className="border-rule-strong bg-glare hover:border-cool-600 hover:bg-cool-600/[0.05] flex w-full items-center gap-2.5 border px-3.5 py-3 text-left text-xs transition-colors disabled:opacity-60"
      >
        {status === 'loading' ? (
          <SpinnerIcon className="text-cool-600 h-4 w-4 shrink-0" />
        ) : (
          <FileIcon className="text-cool-600 h-4 w-4 shrink-0" />
        )}
        <span className="text-ink min-w-0 flex-1 font-medium">{label}</span>
        <span className="label text-cool-600">View</span>
      </button>
      {error && (
        <p role="alert" className="text-hot-600 mt-2 flex items-center gap-1.5 text-xs">
          <AlertIcon className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

/* --------------------------------- detail --------------------------------- */

function Row({ term, children }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <dt className="text-ink-soft text-xs">{term}</dt>
      <dd className="text-ink max-w-[60%] text-right text-xs break-words">{children || '—'}</dd>
    </div>
  )
}

function Submission({ row, onReviewed }) {
  const [reason, setReason] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const applicant = row.profiles ?? {}
  const files = [row.business_registration_url, row.pv_certification_url].filter(Boolean)
  const history = row.rejection_history ?? []

  const approve = async () => {
    setStatus('approving')
    setError('')
    const result = await approveVerification(row.id, row.profile_id)
    if (result?.error) {
      setError(result.error)
      setStatus('idle')
      return
    }
    onReviewed()
  }

  const reject = async () => {
    if (!reason.trim()) {
      setError('Say why. The applicant is told this, and "rejected" on its own is not something anyone can act on.')
      return
    }
    setStatus('rejecting')
    setError('')
    const result = await rejectVerification(row.profile_id, reason.trim(), files)
    if (result?.error) {
      setError(result.error)
      setStatus('idle')
      return
    }
    onReviewed()
  }

  const busy = status !== 'idle'

  return (
    <article className="border-rule bg-glare corner-ticks border p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="display-wide text-display-3 text-ink font-semibold">
            {applicant.company_name || applicant.full_name || 'Unnamed applicant'}
          </h2>
          {applicant.company_name && applicant.full_name && (
            <p className="text-ink-soft mt-1.5 text-sm">{applicant.full_name}</p>
          )}
        </div>
        <div className="text-right">
          <StatusChip status={applicant.verification_status} />
          <p className="text-ink-soft mt-2 text-xs">waiting {waitingSince(row.submitted_at)}</p>
        </div>
      </div>

      <Rule className="my-6" />

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="label text-ink-soft">Declared</h3>
          <dl className="divide-rule mt-3 divide-y">
            <Row term="Business reg. no.">{row.business_registration_number}</Row>
            <Row term="Years installing">{row.years_installing}</Row>
            <Row term="Annual volume">{row.annual_install_volume}</Row>
            <Row term="Service area">{row.primary_service_area}</Row>
            <Row term="Submitted">{when(row.submitted_at)}</Row>
            <Row term="Attempt">{row.attempt_count ?? 1}</Row>
          </dl>
        </div>

        <div>
          <h3 className="label text-ink-soft">Documents</h3>
          <div className="mt-3 grid gap-3">
            <DocumentLink label="Business registration" path={row.business_registration_url} />
            <DocumentLink label="PV certification" path={row.pv_certification_url} />
          </div>

          {history.length > 0 && (
            <div className="border-hot-600/30 bg-hot-600/[0.05] mt-5 border p-4">
              <h3 className="label text-hot-700">
                Rejected before — {history.length} {history.length === 1 ? 'time' : 'times'}
              </h3>
              <ul className="mt-3 grid gap-2.5">
                {history.map((entry, i) => (
                  <li key={i} className="text-ink text-xs leading-relaxed">
                    <span className="text-ink-soft font-mono text-[11px]">{when(entry.rejected_at)}</span>
                    <br />
                    {entry.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="border-hot-600/40 bg-hot-600/[0.06] text-ink mt-6 flex items-start gap-2.5 border px-3.5 py-3 text-xs leading-relaxed"
        >
          <AlertIcon className="text-hot-600 mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      <Rule className="my-6" />

      {!rejecting ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={approve} disabled={busy}>
            {status === 'approving' ? (
              <>
                <SpinnerIcon className="h-4 w-4" />
                Approving…
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" strokeWidth={2.2} />
                Approve installer
              </>
            )}
          </Button>
          <Button variant="ghost" onClick={() => setRejecting(true)} disabled={busy}>
            Reject
          </Button>
          <p className="text-ink-soft ml-auto text-xs">
            Approving unlocks trade pricing for this account immediately.
          </p>
        </div>
      ) : (
        <div className="animate-reveal">
          <label htmlFor={`reason-${row.id}`} className="label text-ink mb-2 block">
            Reason for rejection
            <span className="text-hot-600 ml-1" aria-hidden="true">
              *
            </span>
          </label>
          <textarea
            id={`reason-${row.id}`}
            rows={3}
            value={reason}
            autoFocus
            onChange={(e) => {
              setReason(e.target.value)
              if (error) setError('')
            }}
            placeholder="The registration document is expired — send the current one."
            className="bg-glare border-rule-strong text-ink placeholder:text-ink-soft hover:border-ink-soft focus:border-ink w-full resize-y border px-3.5 py-2.5 text-sm transition-colors outline-none"
          />
          <p className="text-hot-700 mt-2 text-xs leading-relaxed">
            This deletes the account outright — login, profile, documents, everything. There is no resubmission; to try
            again they would have to register from scratch. This cannot be undone.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="hot" onClick={reject} disabled={busy}>
              {status === 'rejecting' ? (
                <>
                  <SpinnerIcon className="h-4 w-4" />
                  Deleting account…
                </>
              ) : (
                'Reject and delete account'
              )}
            </Button>
            <Button variant="ghost" onClick={() => setRejecting(false)} disabled={busy}>
              Back
            </Button>
          </div>
        </div>
      )}
    </article>
  )
}


/* --------------------------------- screen --------------------------------- */

export default function ReviewQueue({ initialQueue }) {
  const router = useRouter()
  const [queue, setQueue] = useState(initialQueue)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState('')

  const refresh = async () => {
    setRefreshing(true)
    const result = await getPendingVerifications()
    setRefreshing(false)

    if (result?.error) {
      setLoadError(result.error)
      return
    }

    setLoadError('')
    setQueue(result.data ?? [])

    // The waiting count in the rail is server-rendered, so replacing the queue
    // in state alone would leave a freshly approved installer still counted.
    router.refresh()
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-wide text-display-2 text-ink font-semibold">Installer verification</h1>
          <p className="text-ink-soft max-w-measure mt-3 leading-relaxed">
            Every account that ticked “I am a solar installer” lands here. Nothing they typed is trusted until somebody
            has opened the document behind it.
          </p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={refreshing}>
          {refreshing ? (
            <>
              <SpinnerIcon className="h-4 w-4" />
              Refreshing…
            </>
          ) : (
            'Refresh'
          )}
        </Button>
      </div>

      {loadError && (
        <p
          role="alert"
          className="border-hot-600/40 bg-hot-600/[0.06] text-ink mt-8 flex items-start gap-2.5 border px-3.5 py-3 text-xs leading-relaxed"
        >
          <AlertIcon className="text-hot-600 mt-px h-3.5 w-3.5 shrink-0" />
          {loadError}
        </p>
      )}

      <div className="mt-8 grid gap-6">
        {queue.length === 0 ? (
          <div className="border-rule bg-glare flex flex-col items-center border border-dashed px-6 py-20 text-center">
            <ShieldIcon className="text-hush h-8 w-8" />
            <p className="text-ink mt-5 font-medium">Nothing waiting</p>
            <p className="text-ink-soft max-w-measure mt-2 text-sm leading-relaxed">
              Every submitted verification has been reviewed. New installer registrations appear here as soon as their
              documents are uploaded.
            </p>
          </div>
        ) : (
          queue.map((row) => <Submission key={row.id} row={row} onReviewed={refresh} />)
        )}
      </div>
    </>
  )
}
