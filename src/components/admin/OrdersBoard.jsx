'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Rule, cx } from '../ui.jsx'
import { AlertIcon, FileIcon, SpinnerIcon } from '../icons.jsx'
import { setOrderStatus } from '@/app/actions/orders'

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
  pending_bank_transfer: 'border-rule-strong bg-sheet text-ink-soft',
  paid: 'border-cool-600/45 bg-cool-600/[0.07] text-cool-700',
  processing: 'border-cool-600/45 bg-cool-600/[0.07] text-cool-700',
  shipped: 'border-cool-600/45 bg-cool-600/[0.07] text-cool-700',
  completed: 'border-cool-600/45 bg-cool-600/[0.07] text-cool-700',
  cancelled: 'border-hot-600/45 bg-hot-600/[0.06] text-hot-700',
}

/** What an admin may move an order to, from where it is now. */
const NEXT_STATUSES = {
  pending: ['cancelled'],
  pending_bank_transfer: ['cancelled'],
  paid: ['processing', 'shipped', 'completed', 'cancelled'],
  processing: ['shipped', 'completed', 'cancelled'],
  shipped: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

const STATUS_LABEL = {
  pending: 'pending',
  pending_bank_transfer: 'pending (bank transfer)',
  paid: 'paid',
  processing: 'processing',
  shipped: 'shipped',
  completed: 'completed',
  cancelled: 'cancelled',
}

function StatusChip({ status }) {
  return (
    <span className={cx('label inline-flex items-center border px-2 py-1', STATUS_TONE[status] ?? STATUS_TONE.pending)}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

/* ---------------------------------- order --------------------------------- */

function Order({ order, onChanged }) {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const items = order.order_items ?? []
  const busy = status !== 'idle'
  const options = NEXT_STATUSES[order.status] ?? []
  const customer = order.customer

  const move = async (nextStatus) => {
    setStatus(nextStatus)
    setError('')
    const result = await setOrderStatus(order.id, nextStatus)
    setStatus('idle')
    if (result?.error) {
      setError(result.error)
      return
    }
    onChanged()
  }

  return (
    <article className={cx('border-rule bg-glare border p-6 sm:p-8', options.length > 0 && 'corner-ticks')}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-ink-soft font-mono text-xs">{order.id}</p>
          <h2 className="display-wide text-display-3 text-ink mt-2 font-semibold">
            {customer?.full_name || 'Unknown customer'}
          </h2>
          <p className="text-ink-soft mt-1.5 text-sm">
            {[customer?.email, customer?.phone].filter(Boolean).join(' · ') || 'No contact details'}
          </p>
        </div>
        <div className="text-right">
          <StatusChip status={order.status} />
          <p className="text-ink-soft mt-2 text-xs">{when(order.created_at)}</p>
        </div>
      </div>

      <Rule className="my-6" />

      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="label text-ink-soft">
          Payment — <span className="text-ink font-medium">{order.payment_method ?? '—'}</span>
        </span>
        {order.payment_reference && (
          <span className="label text-ink-soft font-mono">Ref {order.payment_reference}</span>
        )}
        {order.paid_at && <span className="label text-ink-soft">Paid {when(order.paid_at)}</span>}
      </div>

      <table className="mt-5 w-full border-collapse text-left">
        <thead>
          <tr className="border-rule border-b">
            <th className="label text-ink-soft pb-2 font-medium">Product</th>
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
                <td className="text-ink py-2.5 text-sm">{item.products?.name ?? 'Deleted product'}</td>
                <td className="text-ink py-2.5 text-right font-mono text-sm tabular-nums">{item.quantity}</td>
                <td className="text-ink-soft py-2.5 text-right font-mono text-xs tabular-nums">
                  {peso(item.price_at_purchase)}
                </td>
                <td className="text-ink py-2.5 text-right font-mono text-sm tabular-nums">
                  {peso(Number(item.price_at_purchase) * item.quantity)}
                </td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="label text-ink-soft pt-3 text-right">
              Total
            </td>
            <td className="text-ink pt-3 text-right font-mono text-sm font-semibold tabular-nums">
              {peso(order.total)}
            </td>
          </tr>
        </tfoot>
      </table>

      {error && (
        <p
          role="alert"
          className="border-hot-600/40 bg-hot-600/[0.06] text-ink mt-6 flex items-start gap-2.5 border px-3.5 py-3 text-xs leading-relaxed"
        >
          <AlertIcon className="text-hot-600 mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {options.length > 0 && (
        <>
          <Rule className="my-6" />
          <div className="flex flex-wrap items-center gap-3">
            {options
              .filter((s) => s !== 'cancelled')
              .map((s) => (
                <Button key={s} onClick={() => move(s)} disabled={busy}>
                  {status === s ? (
                    <>
                      <SpinnerIcon className="h-4 w-4" />
                      Marking {STATUS_LABEL[s]}…
                    </>
                  ) : (
                    `Mark ${STATUS_LABEL[s]}`
                  )}
                </Button>
              ))}
            <Button variant="ghost" onClick={() => move('cancelled')} disabled={busy}>
              {status === 'cancelled' ? 'Cancelling…' : 'Cancel order'}
            </Button>
            {order.status === 'paid' && (
              <p className="text-ink-soft ml-auto text-xs">Moving this off "paid" takes its quantities out of stock.</p>
            )}
          </div>
        </>
      )}
    </article>
  )
}

/* --------------------------------- screen --------------------------------- */

const FILTERS = [
  { id: 'paid', label: 'Awaiting fulfilment' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'all', label: 'All' },
]

export default function OrdersBoard({ orders }) {
  const router = useRouter()
  const [filter, setFilter] = useState('paid')

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
              {filter === 'paid' ? 'Nothing awaiting fulfilment' : 'Nothing here'}
            </p>
            <p className="text-ink-soft max-w-measure mt-2 text-sm leading-relaxed">
              {orders.length === 0
                ? 'No orders have been placed yet. Checkout writes here once a customer pays via GCash, QR Ph, or PesoNet.'
                : 'Every order in this state has been dealt with.'}
            </p>
          </div>
        ) : (
          shown.map((order) => <Order key={order.id} order={order} onChanged={() => router.refresh()} />)
        )}
      </div>
    </>
  )
}
