'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { confirmDelivery } from '@/app/actions/checkout'
import { Button } from './ui.jsx'
import { AlertIcon, SpinnerIcon, UploadIcon } from './icons.jsx'

/**
 * The last step, and the only one the customer takes on their own.
 *
 * Nobody in the back office can know first-hand that a box arrived, so
 * closing the order is theirs to do. Pressing it needs a photo of what turned
 * up — that is what makes "received" a record rather than a claim, and it is
 * the thing a later dispute turns on.
 *
 * Single-use, and not by disabling a button: confirm_delivery() only moves an
 * order that is still `shipped`, so a second press has nothing to move. Once
 * it is through, this panel stops rendering entirely.
 */
export default function DeliveryPanel({ order }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [proof, setProof] = useState(null)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)

  const send = async (event) => {
    event.preventDefault()
    if (!proof) {
      setError('Attach a photo of what arrived.')
      return
    }

    setError(null)
    setPending(true)

    const data = new FormData()
    data.set('orderId', order.id)
    data.set('proof', proof)

    const result = await confirmDelivery(data)
    setPending(false)

    if (result?.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  if (!open) {
    return (
      <div className="border-cool-600/40 bg-cool-600/[0.05] rounded-panel mt-5 border p-5">
        <p className="text-ink font-medium">On its way to you</p>
        <p className="text-ink-soft mt-3 text-sm leading-relaxed">
          Once it arrives, press Received and attach a photo of what turned up. That closes the order and is what we
          both have on record if anything is queried later.
        </p>
        <Button type="button" size="sm" className="mt-4" onClick={() => setOpen(true)}>
          Received
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={send} className="border-cool-600/40 bg-cool-600/[0.05] rounded-panel mt-5 border p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-ink font-medium">Confirm it arrived</p>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setProof(null)
            setError(null)
          }}
          className="text-ink-soft hover:text-ink text-xs font-medium transition-colors"
        >
          Not yet
        </button>
      </div>

      <p className="text-ink-soft mt-3 text-sm leading-relaxed">
        A photo of the boxes where they were left is enough. This can only be done once — the order closes as soon as
        you send it.
      </p>

      <label className="border-rule-strong hover:border-ink-soft bg-glare rounded-row mt-4 flex cursor-pointer items-center gap-3 border border-dashed px-4 py-3.5 transition-colors">
        <UploadIcon className="text-ink-soft h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 text-sm">
          {proof ? (
            <span className="text-ink block truncate font-medium">{proof.name}</span>
          ) : (
            <span className="text-ink-soft">Photo of the delivery</span>
          )}
        </span>
        <span className="label text-ink-soft shrink-0">{proof ? 'Change' : 'Browse'}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
          className="sr-only"
          onChange={(e) => {
            setProof(e.target.files?.[0] ?? null)
            setError(null)
          }}
        />
      </label>

      {error && (
        <p role="alert" className="border-hot-600 text-hot-600 rounded-row mt-4 flex items-start gap-2 border px-3.5 py-2.5 text-sm">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending || !proof} className="mt-4">
        {pending && <SpinnerIcon className="h-4 w-4" />}
        {pending ? 'Closing the order…' : 'Confirm received'}
      </Button>
    </form>
  )
}
