'use client'

import { useEffect, useId, useRef } from 'react'
import { Button, Eyebrow, cx } from './ui.jsx'
import { AlertIcon } from './icons.jsx'

/**
 * Fires the moment "Checkout" is clicked, before the address is even
 * carried to the summary screen — a second, earlier gate on top of the
 * no-refunds line already in the summary's agreement checkbox, for anyone
 * who would otherwise land there and click straight through.
 */
export default function NoRefundsDialog({ open, onConfirm, onClose }) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className={cx(
        'bg-glare text-ink border-rule m-auto w-[min(26rem,calc(100vw-2rem))] border p-0',
        'backdrop:bg-pit/70 backdrop:backdrop-blur-sm',
      )}
    >
      {open && (
        <div className="animate-reveal p-6 sm:p-8">
          <Eyebrow>Before you continue</Eyebrow>
          <h2 id={titleId} className="display-wide text-display-3 mt-3 font-semibold">
            All sales are final
          </h2>

          <p className="border-hot-600/40 bg-hot-600/[0.06] text-ink mt-5 flex items-start gap-2.5 border px-3.5 py-3 text-sm leading-relaxed">
            <AlertIcon className="text-hot-600 mt-0.5 h-4 w-4 shrink-0" />
            There are no refunds once an order is placed. Please check your quantity and address before you proceed.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button type="button" variant="hot" size="lg" onClick={onConfirm} className="flex-1">
              I understand, continue
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </dialog>
  )
}
