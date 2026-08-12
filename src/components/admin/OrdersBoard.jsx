'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Rule, cx } from '../ui.jsx'
import { AlertIcon, CheckIcon, FileIcon, SpinnerIcon } from '../icons.jsx'
import { approveOrder, rejectOrder } from '@/app/actions/orders'

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

const peso = (n) =>
  n == null ? '—' : new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(n))

const STATUS_TONE = {
  pending: 'border-rule-strong bg-sheet text-ink-soft',
  approved: 'border-cool-600/45 bg-cool-600/[0.07] text-cool-700',
  rejected: 'border-hot-600/45 bg-hot-600/[0.06] text-hot-700',
}

function StatusChip({ status }) {
  return (
    <span className={cx('label inline-flex items-center border px-2 py-1', STATUS_TONE[status] ?? STATUS_TONE.pending)}>
      {status}
    </span>
  )
}

/* ---------------------------------- order --------------------------------- */

function Order({ order, onReviewed }) {
  const [reason, setReason] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const items = order.order_items ?? []
  const total = items.reduce((sum, i) => sum + (Number(i.unit_price) || 0) * i.quantity, 0)
  const busy = status !== 'idle'
  const open = order.status === 'pending'

  const approve = async () => {
    setStatus('approving')
    setError('')
    const result = await approveOrder(order.id)
    if (result?.error) {
      setError(result.error)
      setStatus('idle')
      return
    }
    onReviewed()
  }

  const reject = async () => {
    if (!reason.trim()) {
      setError('Say why. The customer is told this, and "rejected" on its own is not something anyone can act on.')
      return
    }
    setStatus('rejecting')
    setError('')
    const result = await rejectOrder(order.id, reason.trim())
    if (result?.error) {
      setError(result.error)
      setStatus('idle')
      return
    }
    onReviewed()
  }

  return (
    <article className={cx('border-rule bg-glare border p-6 sm:p-8', open && 'corner-ticks')}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="label text-ink-soft">{order.reference}</p>
          <h2 className="display-wide text-display-3 text-ink mt-2 font-semibold">{order.customer_name}</h2>
          <p className="text-ink-soft mt-1.5 text-sm">
            {[order.customer_email, order.customer_phone].filter(Boolean).join(' · ') || 'No contact details'}
          </p>
        </div>
        <div className="text-right">
          <StatusChip status={order.status} />
          <p className="text-ink-soft mt-2 text-xs">{when(order.placed_at)}</p>
        </div>
      </div>

      <Rule className="my-6" />

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-rule border-b">
            <th className="label text-ink-soft pb-2 font-medium">Model</th>
            <th className="label text-ink-soft pb-2 text-right font-medium">Qty</th>
            <th className="label text-ink-soft pb-2 text-right font-medium">Unit</th>
            <th className="label text-ink-soft pb-2 text-right font-medium">Line</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-ink-soft py-4 text-center text-sm">
                This order has no line items.
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id} className="border-rule border-b last:border-b-0">
                <td className="py-2.5">
                  <span className="text-ink block font-mono text-xs font-medium">{item.model}</span>
                  {item.description && <span className="text-ink-soft block text-xs">{item.description}</span>}
                </td>
                <td className="text-ink py-2.5 text-right font-mono text-sm tabular-nums">{item.quantity}</td>
                <td className="text-ink-soft py-2.5 text-right font-mono text-xs tabular-nums">
                  {peso(item.unit_price)}
                </td>
                <td className="text-ink py-2.5 text-right font-mono text-sm tabular-nums">
                  {item.unit_price == null ? '—' : peso(Number(item.unit_price) * item.quantity)}
                </td>
              </tr>
            ))
          )}
        </tbody>
        {items.some((i) => i.unit_price != null) && (
          <tfoot>
            <tr>
              <td colSpan={3} className="label text-ink-soft pt-3 text-right">
                Total
              </td>
              <td className="text-ink pt-3 text-right font-mono text-sm font-semibold tabular-nums">{peso(total)}</td>
            </tr>
          </tfoot>
        )}
      </table>

      {order.notes && (
        <p className="border-rule bg-sheet/60 text-ink-soft mt-5 border px-4 py-3 text-xs leading-relaxed">
          {order.notes}
        </p>
      )}

      {order.status === 'rejected' && order.rejection_reason && (
        <div className="border-hot-600/30 bg-hot-600/[0.05] mt-5 border p-4">
          <h3 className="label text-hot-700">Reason given</h3>
          <p className="text-ink mt-2 text-xs leading-relaxed">{order.rejection_reason}</p>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="border-hot-600/40 bg-hot-600/[0.06] text-ink mt-6 flex items-start gap-2.5 border px-3.5 py-3 text-xs leading-relaxed"
        >
          <AlertIcon className="text-hot-600 mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {open && (
        <>
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
                    Approve order
                  </>
                )}
              </Button>
              <Button variant="ghost" onClick={() => setRejecting(true)} disabled={busy}>
                Reject
              </Button>
              <p className="text-ink-soft ml-auto text-xs">Approving takes these quantities out of stock.</p>
            </div>
          ) : (
            <div className="animate-reveal">
              <label htmlFor={`reason-${order.id}`} className="label text-ink mb-2 block">
                Reason for rejection
                <span className="text-hot-600 ml-1" aria-hidden="true">
                  *
                </span>
              </label>
              <textarea
                id={`reason-${order.id}`}
                rows={3}
                value={reason}
                autoFocus
                onChange={(e) => {
                  setReason(e.target.value)
                  if (error) setError('')
                }}
                placeholder="The H8K-LS is on back order until the 20th — we can ship the H6K-LS now instead."
                className="bg-glare border-rule-strong text-ink placeholder:text-ink-soft hover:border-ink-soft focus:border-ink w-full resize-y border px-3.5 py-2.5 text-sm transition-colors outline-none"
              />
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button variant="hot" onClick={reject} disabled={busy}>
                  {status === 'rejecting' ? (
                    <>
                      <SpinnerIcon className="h-4 w-4" />
                      Rejecting…
                    </>
                  ) : (
                    'Confirm rejection'
                  )}
                </Button>
                <Button variant="ghost" onClick={() => setRejecting(false)} disabled={busy}>
                  Back
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </article>
  )
}

/* --------------------------------- screen --------------------------------- */

const FILTERS = [
  { id: 'pending', label: 'Awaiting review' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
]

export default function OrdersBoard({ orders }) {
  const router = useRouter()
  const [filter, setFilter] = useState('pending')

  const counts = useMemo(
    () =>
      orders.reduce((acc, o) => ({ ...acc, [o.status]: (acc[o.status] ?? 0) + 1, all: orders.length }), {
        all: orders.length,
      }),
    [orders],
  )

  const shown = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  return (
    <>
      <div className="border-rule mt-8 flex flex-wrap gap-1 border-b">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            aria-current={filter === id ? 'true' : undefined}
            className={cx(
              '-mb-px border-b-2 px-4 py-2.5 text-sm transition-colors',
              filter === id
                ? 'border-cool-600 text-ink font-medium'
                : 'text-ink-soft hover:text-ink border-transparent',
            )}
          >
            {label}
            <span className="ml-2 font-mono text-xs tabular-nums opacity-70">{counts[id] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6">
        {shown.length === 0 ? (
          <div className="border-rule bg-glare flex flex-col items-center border border-dashed px-6 py-20 text-center">
            <FileIcon className="text-hush h-8 w-8" />
            <p className="text-ink mt-5 font-medium">
              {filter === 'pending' ? 'Nothing awaiting review' : 'Nothing here'}
            </p>
            <p className="text-ink-soft max-w-measure mt-2 text-sm leading-relaxed">
              {orders.length === 0
                ? 'No orders have been placed yet. Nothing on the public site creates one — add a row to the orders table in Supabase to try this page out.'
                : 'Every order in this state has been dealt with.'}
            </p>
          </div>
        ) : (
          shown.map((order) => <Order key={order.id} order={order} onReviewed={() => router.refresh()} />)
        )}
      </div>
    </>
  )
}
