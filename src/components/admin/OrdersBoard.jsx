'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Rule, cx } from '../ui.jsx'
import { Field, TextInput } from '../form.jsx'
import { AlertIcon, CheckIcon, FileIcon, HeadsetIcon, SpinnerIcon } from '../icons.jsx'
import {
  setOrderStatus,
  setOrderTotal,
  updateOrderAddress,
  updateOrderNotes,
  updateOrderTracking,
} from '@/app/actions/orders'
import { getPaymentProofUrl } from '@/app/actions/checkout'

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
  approved: 'border-cool-600/45 bg-cool-600/[0.07] text-cool-700',
  pending: 'border-rule-strong bg-sheet text-ink-soft',
  pending_bank_transfer: 'border-rule-strong bg-sheet text-ink-soft',
  paid: 'border-cool-600/45 bg-cool-600/[0.07] text-cool-700',
  processing: 'border-cool-600/45 bg-cool-600/[0.07] text-cool-700',
  shipped: 'border-cool-600/45 bg-cool-600/[0.07] text-cool-700',
  completed: 'border-cool-600/45 bg-cool-600/[0.07] text-cool-700',
  cancelled: 'border-hot-600/45 bg-hot-600/[0.06] text-hot-700',
}

/**
 * What an admin may move an order to, from where it is now.
 *
 * pending / pending_bank_transfer -> paid is a manual confirmation rather
 * than a fulfilment step — with no live payment gateway wired in yet, it is
 * the only way anything ever leaves "awaiting payment". See
 * admin_set_order_status() in supabase-admin-order-management.sql.
 */
const NEXT_STATUSES = {
  // A pending order is approved, never paid directly: the confirmation call
  // is the step between them, and skipping it here would let the back office
  // do exactly what the flow exists to prevent.
  pending: ['approved', 'cancelled'],
  pending_bank_transfer: ['approved', 'cancelled'],
  approved: ['paid', 'cancelled'],
  paid: ['processing', 'shipped', 'completed', 'cancelled'],
  processing: ['shipped', 'completed', 'cancelled'],
  shipped: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

const STATUS_LABEL = {
  pending: 'awaiting call',
  pending_bank_transfer: 'pending (bank transfer)',
  approved: 'approved — awaiting payment',
  paid: 'paid',
  processing: 'processing',
  shipped: 'shipped',
  completed: 'completed',
  cancelled: 'cancelled',
}

/** The button copy for moving *to* this status — "Confirm payment received"
 *  reads correctly whether the money was GCash, QR Ph or a bank transfer
 *  read off a statement, so it is not worded around any one method. */
const MOVE_LABEL = { approved: 'Confirmed on the call', paid: 'Confirm payment received' }

/**
 * Shows the customer's payment proof inline, so an admin can check it against
 * the order without leaving the page.
 *
 * The URL is minted on demand rather than stored: the bucket is private and
 * the signature lasts five minutes, so a URL that ends up in a chat log or a
 * browser history is not a standing key to somebody's bank screenshot. It is
 * the same arrangement verification documents use. Toggling closed and back
 * open re-fetches rather than reusing the old URL, since it may have expired.
 */
function ProofLink({ orderId }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [url, setUrl] = useState(null)

  const toggle = async () => {
    if (url) {
      setUrl(null)
      return
    }
    setBusy(true)
    setError(null)
    const result = await getPaymentProofUrl(orderId)
    setBusy(false)

    if (result?.error) {
      setError(result.error)
      return
    }
    setUrl(result.data)
  }

  return (
    <>
      <Button variant="outline" onClick={toggle} disabled={busy}>
        {busy ? <SpinnerIcon className="h-4 w-4" /> : <FileIcon className="h-4 w-4" />}
        {busy ? 'Opening…' : url ? 'Hide payment proof' : 'View payment proof'}
      </Button>
      {error && <span className="text-hot-600 text-xs">{error}</span>}
      {url && (
        <div className="border-rule bg-sheet/60 mt-3 w-full border p-3">
          <img src={url} alt="Customer's payment proof" className="max-h-[32rem] w-auto max-w-full object-contain" />
        </div>
      )}
    </>
  )
}

/**
 * The figure agreed on the confirmation call.
 *
 * Only appears on a pending order that has none — a product with no catalogue
 * price can still be ordered, because the call is where the price is settled.
 * VAT is added by the database, so this asks for the VAT-exclusive figure and
 * says so; two people typing a VAT-inclusive number into a VAT-exclusive
 * field is how a total ends up 12 % wrong.
 */
function PriceEditor({ order }) {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const save = async () => {
    setBusy(true)
    setError(null)
    const result = await setOrderTotal(order.id, value)
    setBusy(false)

    if (result?.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="border-hot-400/50 bg-hot-600/[0.05] mb-4 w-full border px-3.5 py-3">
      <p className="label text-ink-soft">Price agreed on the call</p>
      <p className="text-ink-soft mt-2 text-sm leading-relaxed">
        This order was placed against a product with no catalogue price, so it has no total yet. Enter what was
        agreed, VAT-exclusive — the 12 % is added on top. It cannot be approved until this is set.
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="min-w-[10rem]">
          <span className="label text-ink-soft">Subtotal (₱, VAT-exclusive)</span>
          <TextInput
            type="number"
            inputMode="decimal"
            min="1"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-2"
          />
        </label>
        <Button onClick={save} disabled={busy || !value}>
          {busy && <SpinnerIcon className="h-4 w-4" />}
          {busy ? 'Saving…' : 'Set the price'}
        </Button>
      </div>

      {error && <p className="text-hot-600 mt-3 text-xs">{error}</p>}
    </div>
  )
}

function StatusChip({ status }) {
  return (
    <span className={cx('label inline-flex items-center border px-2 py-1', STATUS_TONE[status] ?? STATUS_TONE.pending)}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

/* ------------------------------ inline editors ----------------------------- */

/** Small "Save"/"Saving…"/"Saved" button that resets itself after a beat. */
function SaveButton({ pending, saved, ...rest }) {
  return (
    <Button type="submit" size="sm" disabled={pending} {...rest}>
      {pending && <SpinnerIcon className="h-3.5 w-3.5" />}
      {pending ? 'Saving…' : saved ? 'Saved' : 'Save'}
    </Button>
  )
}

/**
 * The shipping address, editable in place. Four fields, same rule checkout
 * itself applies — the database rejects anything less, so a caught typo
 * cannot be half-fixed.
 */
function AddressEditor({ order, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [address, setAddress] = useState({
    streetAddress: order.street_address ?? '',
    city: order.city ?? '',
    province: order.province ?? '',
    postalCode: order.postal_code ?? '',
  })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (e) => setAddress((a) => ({ ...a, [key]: e.target.value }))

  const save = async (e) => {
    e.preventDefault()
    setPending(true)
    setError('')
    const result = await updateOrderAddress(order.id, address)
    setPending(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    setEditing(false)
    onChanged()
  }

  if (!editing) {
    return (
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="label text-ink-soft">Shipping to</p>
            <address className="text-ink mt-1.5 text-sm leading-relaxed not-italic">
              {order.street_address || '—'}
              <br />
              {[order.city, order.province, order.postal_code].filter(Boolean).join(', ') || '—'}
            </address>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-ink-soft hover:text-ink shrink-0 text-xs font-medium underline underline-offset-2 transition-colors"
          >
            Edit
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
      <Field label="Street address" required className="sm:col-span-2">
        {(p) => <TextInput {...p} value={address.streetAddress} onChange={set('streetAddress')} />}
      </Field>
      <Field label="City" required>
        {(p) => <TextInput {...p} value={address.city} onChange={set('city')} />}
      </Field>
      <Field label="Province" required>
        {(p) => <TextInput {...p} value={address.province} onChange={set('province')} />}
      </Field>
      <Field label="ZIP code" required hint="Four digits." className="sm:col-span-2">
        {(p) => (
          <TextInput
            {...p}
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            value={address.postalCode}
            onChange={set('postalCode')}
          />
        )}
      </Field>

      {error && (
        <p role="alert" className="text-hot-600 flex items-center gap-1.5 text-xs sm:col-span-2">
          <AlertIcon className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex items-center gap-2 sm:col-span-2">
        <SaveButton pending={pending} />
        <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

/** Courier and tracking number — settable any time, not tied to marking an order shipped. */
function TrackingEditor({ order, onChanged }) {
  const [courier, setCourier] = useState(order.courier ?? '')
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number ?? '')
  const [pending, setPending] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const save = async (e) => {
    e.preventDefault()
    setPending(true)
    setError('')
    setSaved(false)
    const result = await updateOrderTracking(order.id, { courier, trackingNumber })
    setPending(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    setSaved(true)
    onChanged()
  }

  return (
    <form onSubmit={save} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <Field label="Courier" required>
        {(p) => (
          <TextInput
            {...p}
            placeholder="LBC, J&T, Grab…"
            value={courier}
            onChange={(e) => {
              setCourier(e.target.value)
              setSaved(false)
            }}
          />
        )}
      </Field>
      <Field label="Tracking number" required>
        {(p) => (
          <TextInput
            {...p}
            value={trackingNumber}
            onChange={(e) => {
              setTrackingNumber(e.target.value)
              setSaved(false)
            }}
          />
        )}
      </Field>
      <SaveButton pending={pending} saved={saved} />

      {error && (
        <p role="alert" className="text-hot-600 flex items-center gap-1.5 text-xs sm:col-span-3">
          <AlertIcon className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </form>
  )
}

/** Internal notes. Never shown to the customer — see admin_notes' own comment in the schema. */
function NotesEditor({ order, onChanged }) {
  const [notes, setNotes] = useState(order.admin_notes ?? '')
  const [pending, setPending] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const save = async (e) => {
    e.preventDefault()
    setPending(true)
    setError('')
    setSaved(false)
    const result = await updateOrderNotes(order.id, notes)
    setPending(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    setSaved(true)
    onChanged()
  }

  return (
    <form onSubmit={save}>
      <label className="label text-ink-soft mb-2 block">
        Internal notes<span className="text-ink-soft ml-1.5 normal-case">admins only, not shown to the customer</span>
      </label>
      <textarea
        rows={2}
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value)
          setSaved(false)
        }}
        placeholder="Anything the next admin looking at this order should know."
        className="bg-glare border-rule-strong text-ink placeholder:text-ink-soft hover:border-ink-soft focus:border-ink w-full resize-y border px-3.5 py-2.5 text-sm transition-colors outline-none"
      />

      {error && (
        <p role="alert" className="text-hot-600 mt-2 flex items-center gap-1.5 text-xs">
          <AlertIcon className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="mt-2.5">
        <SaveButton pending={pending} saved={saved} />
      </div>
    </form>
  )
}

/* ---------------------------------- order --------------------------------- */

function Order({ order, onChanged }) {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const items = order.order_items ?? []
  const busy = status !== 'idle'

  // Placed against a product with no catalogue price, so the figure from the
  // call has not been entered yet. Approving would tell the customer to pay a
  // total of zero, so the button stays shut until it is.
  const needsPrice = order.status === 'pending' && !(Number(order.total) > 0)
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
          <div className="flex items-center justify-end gap-2">
            {order.status === 'approved' && order.payment_proof_path && (
              <span className="label border-cool-600/45 bg-cool-600/[0.07] text-cool-700 inline-flex items-center gap-1 border px-2 py-1">
                <CheckIcon className="h-3 w-3" />
                Proof received
              </span>
            )}
            <StatusChip status={order.status} />
          </div>
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

      <Rule className="my-6" />
      <AddressEditor order={order} onChanged={onChanged} />

      <Rule className="my-6" />
      <p className="label text-ink-soft mb-2">Tracking</p>
      <TrackingEditor order={order} onChanged={onChanged} />

      <Rule className="my-6" />
      <NotesEditor order={order} onChanged={onChanged} />

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

          {/* Context before controls: what the customer said, then the figure
              the call settled, then the buttons that act on both. Sitting
              inside the button row they read as controls themselves. */}
          {order.customer_note && (
            <div className="border-rule bg-sheet/60 mb-4 border px-3.5 py-3">
              <p className="label text-ink-soft">What they told us</p>
              <p className="text-ink mt-2 text-sm leading-relaxed whitespace-pre-line">{order.customer_note}</p>
            </div>
          )}

          {needsPrice && <PriceEditor order={order} />}

          <div className="flex flex-wrap items-center gap-3">
            {options
              .filter((s) => s !== 'cancelled')
              .map((s) => (
                <Button key={s} onClick={() => move(s)} disabled={busy}>
                  {status === s ? (
                    <>
                      <SpinnerIcon className="h-4 w-4" />
                      {MOVE_LABEL[s] ? `${MOVE_LABEL[s]}…` : `Marking ${STATUS_LABEL[s]}…`}
                    </>
                  ) : (
                    MOVE_LABEL[s] ?? `Mark ${STATUS_LABEL[s]}`
                  )}
                </Button>
              ))}
            {order.contact_phone && (
              <Button as="a" variant="outline" href={`tel:${order.contact_phone}`}>
                <HeadsetIcon className="h-4 w-4" />
                Call {order.contact_phone}
              </Button>
            )}
            {order.payment_proof_path && <ProofLink orderId={order.id} />}
            <Button variant="ghost" onClick={() => move('cancelled')} disabled={busy}>
              {status === 'cancelled' ? 'Cancelling…' : 'Cancel order'}
            </Button>
            {order.status === 'approved' && !order.payment_proof_path && (
              <p className="text-ink-soft ml-auto text-xs">
                Nothing attached yet — the customer has not sent proof of payment.
              </p>
            )}
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
  { id: 'pending', label: 'Awaiting payment' },
  { id: 'approved', label: 'Awaiting proof of payment' },
  { id: 'paid', label: 'Awaiting fulfilment' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'all', label: 'All' },
]

/** pending and pending_bank_transfer read as one tab — a customer sees the
 *  same split in Purchase history (BUCKETS in PurchaseHistory.jsx), and the
 *  admin's next move on either is identical: confirm the payment or cancel. */
const PENDING_STATUSES = ['pending', 'pending_bank_transfer']

export default function OrdersBoard({ orders }) {
  const router = useRouter()
  const [filter, setFilter] = useState('pending')

  const bucketOf = (status) => (PENDING_STATUSES.includes(status) ? 'pending' : status)

  const counts = useMemo(
    () =>
      orders.reduce((acc, o) => ({ ...acc, [bucketOf(o.status)]: (acc[bucketOf(o.status)] ?? 0) + 1, all: orders.length }), {
        all: orders.length,
      }),
    [orders],
  )

  const shown = filter === 'all' ? orders : orders.filter((o) => bucketOf(o.status) === filter)

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
              {filter === 'pending'
                ? 'Nothing awaiting payment'
                : filter === 'approved'
                  ? 'Nothing awaiting proof of payment'
                  : filter === 'paid'
                    ? 'Nothing awaiting fulfilment'
                    : 'Nothing here'}
            </p>
            <p className="text-ink-soft max-w-measure mt-2 text-sm leading-relaxed">
              {orders.length === 0
                ? 'No orders have been placed yet. Checkout writes here the moment a customer places one.'
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
