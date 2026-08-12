'use client'

import { useMemo, useState } from 'react'
import { Rule, cx } from './ui.jsx'
import { FileIcon } from './icons.jsx'

/**
 * Six statuses, three answers.
 *
 * The lifecycle a payment gateway needs — pending, pending_bank_transfer,
 * paid, processing, shipped, completed, cancelled — is the warehouse's
 * business. A customer is asking one of three things: is it coming, did it
 * arrive, or did it fall through. Everything still in motion is one bucket,
 * and the exact stage shows on the row for anyone who wants it.
 */
const BUCKETS = {
  pending: ['pending', 'pending_bank_transfer', 'paid', 'processing', 'shipped'],
  delivered: ['completed'],
  cancelled: ['cancelled'],
}

const TABS = [
  { id: 'pending', label: 'Pending' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
]

/** What each raw status is called on the row, and how it reads. */
const STAGE = {
  pending: { label: 'Awaiting payment', tone: 'neutral' },
  pending_bank_transfer: { label: 'Awaiting bank transfer', tone: 'neutral' },
  paid: { label: 'Paid', tone: 'cool' },
  processing: { label: 'Being prepared', tone: 'cool' },
  shipped: { label: 'On the way', tone: 'cool' },
  completed: { label: 'Delivered', tone: 'cool' },
  cancelled: { label: 'Cancelled', tone: 'hot' },
}

const TONE = {
  neutral: 'border-rule-strong bg-sheet text-ink-soft',
  cool: 'border-cool-600/45 bg-cool-600/[0.07] text-cool-700',
  hot: 'border-hot-600/45 bg-hot-600/[0.06] text-hot-700',
}

const peso = (n) =>
  n == null ? '—' : new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(n))

const when = (iso) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const METHOD = { gcash: 'GCash', qrph: 'QR Ph', pesonet: 'PesoNet' }

function Stage({ status }) {
  const stage = STAGE[status] ?? { label: status, tone: 'neutral' }
  return (
    <span className={cx('label inline-flex items-center border px-2 py-1', TONE[stage.tone])}>{stage.label}</span>
  )
}

/* ---------------------------------- order --------------------------------- */

function Order({ order }) {
  const items = order.order_items ?? []
  const count = items.reduce((n, i) => n + i.quantity, 0)

  return (
    <article className="border-rule bg-glare border p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label text-ink-soft">Ordered {when(order.created_at)}</p>
          <p className="text-ink mt-2 font-mono text-sm">
            {count} {count === 1 ? 'item' : 'items'} · {peso(order.total)}
          </p>
          {order.payment_method && (
            <p className="text-ink-soft mt-1.5 text-xs">
              {METHOD[order.payment_method] ?? order.payment_method}
              {order.payment_reference ? ` · ${order.payment_reference}` : ''}
            </p>
          )}
        </div>
        <Stage status={order.status} />
      </div>

      <Rule className="my-5" />

      <ul className="grid gap-3">
        {items.length === 0 ? (
          <li className="text-ink-soft text-sm">No items recorded on this order.</li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="flex items-center gap-3.5">
              {item.products?.image_url ? (
                <img
                  src={item.products.image_url}
                  alt=""
                  loading="lazy"
                  className="h-11 w-11 shrink-0 object-contain"
                />
              ) : (
                <span className="border-rule grid h-11 w-11 shrink-0 place-items-center border border-dashed">
                  <FileIcon className="text-hush h-4 w-4" />
                </span>
              )}

              <span className="min-w-0 flex-1">
                <span className="text-ink block truncate text-sm">{item.products?.name ?? 'Product removed'}</span>
                <span className="text-ink-soft block font-mono text-xs">
                  {item.quantity} × {peso(item.price_at_purchase)}
                </span>
              </span>

              <span className="text-ink shrink-0 font-mono text-sm tabular-nums">
                {peso(Number(item.price_at_purchase) * item.quantity)}
              </span>
            </li>
          ))
        )}
      </ul>
    </article>
  )
}

/* --------------------------------- screen --------------------------------- */

const EMPTY_COPY = {
  pending: 'Nothing on its way at the moment. Orders appear here as soon as they are placed.',
  delivered: 'Nothing delivered yet. Completed orders stay here for your records.',
  cancelled: 'Nothing cancelled. Orders that fall through are kept here so you can see what happened.',
}

export default function PurchaseHistory({ orders }) {
  const [tab, setTab] = useState('pending')

  const counts = useMemo(
    () =>
      Object.fromEntries(
        TABS.map(({ id }) => [id, orders.filter((o) => BUCKETS[id].includes(o.status)).length]),
      ),
    [orders],
  )

  const shown = orders.filter((o) => BUCKETS[tab].includes(o.status))

  return (
    <>
      <div className="border-rule mt-10 flex flex-wrap gap-1 border-b">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id ? 'true' : undefined}
            className={cx(
              '-mb-px border-b-2 px-4 py-2.5 text-sm transition-colors',
              tab === id ? 'border-cool-600 text-ink font-medium' : 'text-ink-soft hover:text-ink border-transparent',
            )}
          >
            {label}
            <span className="ml-2 font-mono text-xs tabular-nums opacity-70">{counts[id]}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6">
        {shown.length === 0 ? (
          <div className="border-rule bg-glare flex flex-col items-center border border-dashed px-6 py-20 text-center">
            <FileIcon className="text-hush h-8 w-8" />
            <p className="text-ink-soft max-w-measure mt-5 text-sm leading-relaxed">{EMPTY_COPY[tab]}</p>
          </div>
        ) : (
          shown.map((order) => <Order key={order.id} order={order} />)
        )}
      </div>
    </>
  )
}
