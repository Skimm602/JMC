'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Eyebrow, cx } from './ui.jsx'
import { XIcon } from './icons.jsx'

/**
 * The consent checkbox sits at the end of a four-step application, so sending
 * someone to a separate page to read what they are agreeing to would cost them
 * the form they just filled in. Same reasoning as the login modal: a native
 * <dialog> keeps the page — and its state — intact underneath.
 *
 * Both documents live in one dialog because nobody reads one without wondering
 * about the other, and switching should not mean closing and re-opening.
 */

const UPDATED = '14 January 2026'

const DOCS = {
  terms: {
    title: 'Terms of sale',
    lede: 'These terms govern VIP accounts and the sale of VIP inverters, batteries and accessories to account holders.',
    sections: [
      {
        heading: 'Your account',
        body: 'One account per person. Keep your credentials to yourself — anything done through your account is treated as done by you. Accounts opened with information we cannot verify may be suspended until it is corrected.',
      },
      {
        heading: 'Installer verification',
        body: 'Trade pricing and advance-replacement RMA are available only to installers we have verified. Registration and licence documents must be current and issued in the name of the company on the account. Claiming trade status you do not hold withdraws trade pricing and may close the account.',
      },
      {
        heading: 'Orders and pricing',
        body: 'Prices exclude VAT, duties and delivery unless stated otherwise. An order is accepted when we confirm dispatch, not when you place it — until then we may decline it or correct a pricing error and let you choose whether to continue.',
      },
      {
        heading: 'Warranty',
        body: 'Inverters carry a ten-year product warranty and accessories five years, from the date of dispatch. Cover depends on installation by a qualified electrician in line with the product manual and on the unit staying within its published operating envelope. Advance-replacement RMA is a verified-installer benefit and ships before the faulty unit is returned.',
      },
      {
        heading: 'Firmware and monitoring',
        body: 'Firmware is licensed with the hardware, not sold, and may not be redistributed or reverse-engineered. The monitoring portal is provided as it stands, without an uptime guarantee — it is a convenience layer, not a safety system, and the inverter operates independently of it.',
      },
      {
        heading: 'Liability',
        body: 'We are not liable for lost generation revenue, lost profit or other indirect loss arising from a fault or from downtime. Nothing here limits liability for death or personal injury caused by our negligence, for fraud, or for anything else that cannot be limited under the law that applies to you.',
      },
      {
        heading: 'Changes',
        body: 'We may update these terms as products and regulations change. Material changes are emailed to account holders before they take effect, and the date above always reflects the current version.',
      },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    lede: 'What VIP collects when you open an account, why we hold it, and how to get it back or get rid of it.',
    sections: [
      {
        heading: 'What we collect',
        body: 'Your name, email address, country and — for trade accounts — company, role and phone number. Passwords are stored hashed and are never readable by us. We also keep basic usage records such as sign-in times and order history.',
      },
      {
        heading: 'Verification documents',
        body: 'Business registration, contractor licence and insurance documents are used for one purpose: confirming that a trade account belongs to a real installer. Access is limited to the verification team. They are never shown to other customers, never used for marketing and never sold.',
      },
      {
        heading: 'Why we hold it',
        body: 'To operate your account, verify trade status, process orders and warranty claims, and — only if you asked for them — send firmware and product bulletins. You can stop the bulletins from any email without affecting the account.',
      },
      {
        heading: 'Who else sees it',
        body: 'Payment, shipping and email providers acting under contract, and regulators where the law requires it. Nothing is sold to advertisers or data brokers.',
      },
      {
        heading: 'How long we keep it',
        body: 'Account and order records stay while the account is open and for six years after, which is what tax and warranty obligations require. Verification documents are deleted twelve months after the licence they show expires.',
      },
      {
        heading: 'Your rights',
        body: 'You can ask for a copy of what we hold, have it corrected, or have it deleted where we are not required to keep it. You can also withdraw consent at any time, and complain to your national data protection authority if you think we have handled something badly.',
      },
      {
        heading: 'Contact',
        body: 'Write to privacy@vipsolar.example. Requests are answered within thirty days.',
      },
    ],
  },
}

export default function LegalDialog({ doc, onSelect, onClose }) {
  const ref = useRef(null)
  const scrollRef = useRef(null)
  const headingRef = useRef(null)
  const titleId = useId()
  const open = Boolean(doc)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  // A modal dialog makes the page inert but not unscrollable — the backdrop
  // still passes the wheel through to the body behind it.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  // Swapping documents replaces the whole body of the dialog. Without this you
  // land halfway down a document you have not started reading, and a screen
  // reader gets no announcement that anything changed.
  useEffect(() => {
    if (!doc) return
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    headingRef.current?.focus()
  }, [doc])

  const content = doc ? DOCS[doc] : null
  const other = doc === 'terms' ? 'privacy' : 'terms'

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      // The panel fills the dialog box, so anything that lands on the dialog
      // itself came from the backdrop.
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className={cx(
        'bg-glare text-ink rounded-panel border-white shadow-[0_40px_80px_-40px_rgba(15,31,64,0.8)] m-auto w-[min(44rem,calc(100vw-2rem))] max-h-[calc(100dvh-3rem)] border p-0',
        'backdrop:bg-pit/70 backdrop:backdrop-blur-sm',
      )}
    >
      {content && (
        <div className="animate-reveal flex max-h-[calc(100dvh-3rem)] flex-col">
          <div className="border-rule flex items-start justify-between gap-6 border-b px-7 py-6 sm:px-9">
            <div>
              <Eyebrow>Legal — updated {UPDATED}</Eyebrow>
              <h2
                id={titleId}
                ref={headingRef}
                tabIndex={-1}
                className="display-wide text-display-3 mt-3 font-semibold outline-none"
              >
                {content.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-ink-soft hover:text-ink -mt-1 -mr-2 shrink-0 p-2 transition-colors"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-7 py-7 sm:px-9">
            <p className="text-ink-soft leading-relaxed">{content.lede}</p>

            <div className="mt-8 grid gap-7">
              {content.sections.map((s, i) => (
                <section key={s.heading}>
                  <h3 className="flex items-baseline gap-3 text-sm font-semibold">
                    <span className="text-ink-soft font-mono text-xs">{String(i + 1).padStart(2, '0')}</span>
                    {s.heading}
                  </h3>
                  <p className="text-ink-soft mt-2.5 pl-8 text-sm leading-relaxed">{s.body}</p>
                </section>
              ))}
            </div>
          </div>

          <div className="border-rule text-ink-soft flex flex-wrap items-center justify-between gap-4 border-t px-7 py-5 text-sm sm:px-9">
            <span>
              Also read{' '}
              <button
                type="button"
                onClick={() => onSelect(other)}
                className="text-ink border-b border-current/40 pb-px font-medium transition-colors hover:border-current"
              >
                {DOCS[other].title.toLowerCase()}
              </button>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-ink-soft hover:text-ink border-b border-current/40 pb-px text-xs font-medium transition-colors hover:border-current"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
