'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { attachVatExemptionProof } from '@/app/actions/checkout'
import { Button } from './ui.jsx'
import { AlertIcon, CheckIcon, SpinnerIcon, UploadIcon } from './icons.jsx'

/**
 * An optional step on a pending order: if a senior citizen, PWD or other
 * documented exemption came up on the confirmation call, this is where the
 * customer sends what it rests on. Uploading does not remove VAT itself — an
 * admin reads it and decides, the same way a payment proof does not mark an
 * order paid on its own. See VatExemptEditor in admin/OrdersBoard.jsx.
 *
 * Collapsed behind a link until pressed, same reasoning as PaymentPanel's
 * staged reveal: most orders have no exemption to raise, and a dropzone every
 * pending order shows unconditionally reads as something everyone is
 * expected to do.
 */
export default function VatExemptionPanel({ order }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [proof, setProof] = useState(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  if (order.vat_exempt_proof_path) {
    return (
      <p className="border-cool-600/45 bg-cool-600/[0.06] text-ink mt-3 flex items-center gap-2 border px-3.5 py-3 text-sm">
        <CheckIcon className="text-cool-600 h-4 w-4 shrink-0" />
        Exemption document received — we'll apply it on the call if it holds up.
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-ink-soft hover:text-ink mt-3 text-xs font-medium underline underline-offset-2"
      >
        Qualify for a VAT exemption (senior citizen, PWD, or similar)?
      </button>
    )
  }

  const send = async (event) => {
    event.preventDefault()
    if (!proof) {
      setError('Attach a photo or scan of the ID or certificate.')
      return
    }

    setError(null)
    setPending(true)

    const data = new FormData()
    data.set('orderId', order.id)
    data.set('proof', proof)

    const result = await attachVatExemptionProof(data)
    setPending(false)

    if (result?.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <form onSubmit={send} className="mt-3">
      <p className="text-ink-soft text-xs leading-relaxed">
        Senior citizen, PWD or another documented exemption? Attach a photo or scan of the ID or certificate and
        we'll apply it on the call.
      </p>

      <label className="border-rule-strong hover:border-ink-soft bg-glare rounded-row mt-2 flex cursor-pointer items-center gap-3 border border-dashed px-4 py-3.5 transition-colors">
        <UploadIcon className="text-ink-soft h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 text-sm">
          {proof ? (
            <span className="text-ink block truncate font-medium">{proof.name}</span>
          ) : (
            <span className="text-ink-soft">ID or certificate — photo or scan</span>
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
        <p role="alert" className="border-hot-600 text-hot-600 mt-3 flex items-start gap-2 border px-3.5 py-2.5 text-xs">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending || !proof} className="mt-3">
        {pending && <SpinnerIcon className="h-3.5 w-3.5" />}
        {pending ? 'Sending…' : 'Send'}
      </Button>
    </form>
  )
}
