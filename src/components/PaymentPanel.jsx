'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { attachPaymentProof } from '@/app/actions/checkout'
import { methodsFor, PAYMENT_METHODS } from '@/utils/payment-methods'
import { Button, cx } from './ui.jsx'
import { AlertIcon, CheckIcon, SpinnerIcon, UploadIcon } from './icons.jsx'

/**
 * Where a confirmed order gets paid for.
 *
 * Three steps, revealed one at a time rather than stacked: press to start,
 * choose how you are paying, then pay and attach the proof. All three at once
 * is a wall of account numbers, most of which are not the ones you need, and
 * the one that is gets lost among them.
 *
 * Uploading does not mark anything paid. An admin reads the proof and moves
 * the order, because "the customer says they paid" and "the money arrived"
 * are different facts and only one of them belongs to the customer.
 */

const peso = (n) =>
  n == null ? '—' : new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(n))

/** A zero total means the figure from the call has not been entered yet.
    Rendering it as ₱0.00 would tell somebody their equipment is free. */
const money = (n) => (Number(n) > 0 ? peso(n) : 'the agreed amount')

const when = (iso) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

/** The upload itself, shared by the first send and the "clearer one" retry. */
function ProofField({ proof, setProof, onSubmit, pending, error, replace }) {
  return (
    <form onSubmit={onSubmit} className="mt-4">
      <label className="border-rule-strong hover:border-ink-soft bg-glare flex cursor-pointer items-center gap-3 border border-dashed px-4 py-3.5 transition-colors">
        <UploadIcon className="text-ink-soft h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 text-sm">
          {proof ? (
            <span className="text-ink block truncate font-medium">{proof.name}</span>
          ) : (
            <span className="text-ink-soft">
              {replace ? 'Choose a clearer image' : 'Attach the receipt or screenshot'}
            </span>
          )}
        </span>
        <span className="label text-ink-soft shrink-0">{proof ? 'Change' : 'Browse'}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
          className="sr-only"
          onChange={(e) => setProof(e.target.files?.[0] ?? null)}
        />
      </label>

      {error && (
        <p role="alert" className="border-hot-600 text-hot-600 mt-4 flex items-start gap-2 border px-3.5 py-2.5 text-sm">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending || !proof} className="mt-4">
        {pending && <SpinnerIcon className="h-4 w-4" />}
        {pending ? 'Sending…' : 'Send proof of payment'}
      </Button>
    </form>
  )
}

/**
 * The account to send to, and a QR if one has been dropped in.
 *
 * The image is optional on purpose — public/payment/<id>.png either exists or
 * it does not, and this is useful either way. onError hides a missing one
 * rather than leaving a broken-image icon where a QR should be.
 */
function MethodDetails({ method, orderId }) {
  const [copied, setCopied] = useState(null)
  const [hasQr, setHasQr] = useState(true)

  const copy = async (value, key) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      setTimeout(() => setCopied(null), 1600)
    } catch {
      /* clipboard blocked — the value is on screen to read anyway */
    }
  }

  if (!method) return null

  return (
    <div className="border-rule bg-glare mt-4 border p-4">
      <p className="text-ink-soft text-sm leading-relaxed">{method.hint}</p>

      {hasQr && (
        <img
          src={`/payment/${method.id}.png`}
          alt={`${method.label} QR code`}
          onError={() => setHasQr(false)}
          className="border-rule bg-glare mt-4 h-44 w-44 border object-contain p-2"
        />
      )}

      <dl className="mt-4 grid gap-2.5">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="label text-ink-soft">Account name</dt>
          <dd className="text-ink font-mono text-sm">{method.account}</dd>
        </div>

        {method.number && (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="label text-ink-soft">Number</dt>
            <dd className="flex items-baseline gap-2.5">
              <span className="text-ink font-mono text-sm">{method.number}</span>
              <button
                type="button"
                onClick={() => copy(method.number, 'number')}
                className="text-ink-soft hover:text-ink text-xs font-medium transition-colors"
              >
                {copied === 'number' ? 'Copied' : 'Copy'}
              </button>
            </dd>
          </div>
        )}

        {/* The reference is what lets somebody match a bank line to an order
            without asking. Copyable because nobody types a uuid correctly. */}
        <div className="flex items-baseline justify-between gap-4">
          <dt className="label text-ink-soft shrink-0">Reference</dt>
          <dd className="flex min-w-0 items-baseline gap-2.5">
            <span className="text-ink truncate font-mono text-xs">{orderId}</span>
            <button
              type="button"
              onClick={() => copy(orderId, 'ref')}
              className="text-ink-soft hover:text-ink shrink-0 text-xs font-medium transition-colors"
            >
              {copied === 'ref' ? 'Copied' : 'Copy'}
            </button>
          </dd>
        </div>
      </dl>
    </div>
  )
}

export default function PaymentPanel({ order }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState(null)
  const [proof, setProof] = useState(null)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)

  const already = Boolean(order.payment_proof_uploaded_at)
  const methods = methodsFor(order.total)
  const filtered = PAYMENT_METHODS.length - methods.length

  const send = async (event) => {
    event.preventDefault()
    if (!proof) {
      setError('Attach a photo or screenshot of the payment.')
      return
    }

    setError(null)
    setPending(true)

    const data = new FormData()
    data.set('orderId', order.id)
    data.set('proof', proof)

    const result = await attachPaymentProof(data)
    setPending(false)

    if (result?.error) {
      setError(result.error)
      return
    }
    setProof(null)
    router.refresh()
  }

  /* ------------------------------ already sent ----------------------------- */

  if (already) {
    return (
      <div className="border-cool-600/40 bg-cool-600/[0.05] mt-5 border p-5">
        <p className="text-ink flex items-center gap-2.5 font-medium">
          <CheckIcon className="text-cool-600 h-5 w-5 shrink-0" />
          Payment sent to us
        </p>
        <p className="text-ink-soft mt-3 text-sm leading-relaxed">
          We have your proof of payment and are checking it against the account. The order moves to paid once it
          clears — you do not need to do anything else. Sent {when(order.payment_proof_uploaded_at)}.
        </p>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-ink-soft hover:text-ink mt-4 border-b border-current/40 pb-px text-xs font-medium transition-colors"
        >
          {open ? 'Never mind' : 'Send a clearer one'}
        </button>

        {open && (
          <ProofField proof={proof} setProof={setProof} onSubmit={send} pending={pending} error={error} replace />
        )}
      </div>
    )
  }

  /* -------------------------------- step one ------------------------------- */

  if (!open) {
    return (
      <div className="border-cool-600/40 bg-cool-600/[0.05] mt-5 border p-5">
        <p className="text-ink font-medium">Confirmed — ready for payment</p>
        <p className="text-ink-soft mt-3 text-sm leading-relaxed">
          We have called and confirmed this order. {money(order.total)} is due — pay it however suits you from the
          options inside, then attach a photo of it.
        </p>
        <Button type="button" size="sm" className="mt-4" onClick={() => setOpen(true)}>
          Proceed to pay
        </Button>
      </div>
    )
  }

  /* ------------------------- steps two and three --------------------------- */

  return (
    <div className="border-cool-600/40 bg-cool-600/[0.05] mt-5 border p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-ink font-medium">Pay {money(order.total)}</p>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setMethod(null)
          }}
          className="text-ink-soft hover:text-ink text-xs font-medium transition-colors"
        >
          Close
        </button>
      </div>

      <p className="label text-ink-soft mt-4">How are you paying?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {methods.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMethod(m.id === method ? null : m.id)}
            aria-pressed={m.id === method}
            className={cx(
              'border px-3 py-1.5 text-xs font-medium transition-colors',
              m.id === method
                ? 'border-cool-600 bg-cool-600 text-glare'
                : 'border-rule-strong bg-glare text-ink-soft hover:border-ink-soft hover:text-ink',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* GCash is filtered out above its ceiling rather than offered and then
          refused by the app halfway through. Saying why beats a missing option
          somebody goes looking for. */}
      {filtered > 0 && (
        <p className="text-ink-soft mt-3 text-xs leading-relaxed">
          GCash is not offered on this order — it is over the ₱50,000 a wallet can send in one go.
        </p>
      )}

      {method && (
        <>
          <MethodDetails method={methods.find((m) => m.id === method)} orderId={order.id} />
          <ProofField proof={proof} setProof={setProof} onSubmit={send} pending={pending} error={error} />
        </>
      )}
    </div>
  )
}
