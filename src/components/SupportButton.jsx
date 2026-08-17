'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Button, Eyebrow, cx } from './ui.jsx'
import { Field, Textarea, TextInput } from './form.jsx'
import { AlertIcon, CheckIcon, HeadsetIcon, SpinnerIcon, XIcon } from './icons.jsx'
import { sendSupportRequest } from '@/app/actions/support'
import { MESSAGE_LIMIT, MESSAGE_MINIMUM, SUBJECT_LIMIT } from '@/utils/support/limits'
import AssistantDialog from './AssistantDialog.jsx'
import RobotMascot from './RobotMascot.jsx'

/**
 * Customer support, from wherever they are standing.
 *
 * A person who needs help is, by definition, in the middle of something that
 * is not going well — halfway through a checkout, or looking at an order that
 * says the wrong thing. Sending them to a contact page costs them that
 * context and makes them describe it from memory. So this is a control that
 * rides along with every page and opens over it.
 *
 * Rendered only for signed-in customers: the request is sent under the
 * session's own name and address, which is what lets the back office trust
 * who it is replying to.
 */
export default function SupportButton({ email }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)

  return (
    <>
      {/* Bottom right, and below the header's z-50 so the mobile menu covers
          it rather than fighting it for the corner. */}
      <div className="fixed right-4 bottom-4 z-30 flex flex-col items-end gap-2.5 sm:right-6 sm:bottom-6">
        {menuOpen && (
          <div className="animate-reveal flex flex-col items-end gap-2">
            <LauncherOption
              icon={<RobotMascot state="idle" className="h-[1.15rem] w-[1.15rem] shrink-0" />}
              label="Assistant"
              onClick={() => {
                setMenuOpen(false)
                setAssistantOpen(true)
              }}
            />
            <LauncherOption
              icon={<HeadsetIcon className="h-[1.05rem] w-[1.05rem] shrink-0" />}
              label="Customer support"
              onClick={() => {
                setMenuOpen(false)
                setSupportOpen(true)
              }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          aria-haspopup="true"
          aria-expanded={menuOpen}
          className={cx(
            'group/support bg-cool-600 text-glare flex items-center gap-2.5',
            'h-11 px-3.5 text-[0.8125rem] font-medium tracking-[0.01em]',
            'shadow-[0_8px_28px_-8px_rgba(8,28,52,0.55)] transition-colors duration-200',
            'hover:bg-cool-700 active:translate-y-px',
          )}
        >
          {menuOpen ? (
            <XIcon className="h-[1.15rem] w-[1.15rem] shrink-0" />
          ) : (
            <HeadsetIcon className="h-[1.15rem] w-[1.15rem] shrink-0" />
          )}
          {/* The label is the affordance; the icon alone is a guess. It is
              dropped only where the corner is genuinely tight. */}
          <span className="hidden sm:inline">{menuOpen ? 'Close' : 'Support'}</span>
          <span className="sr-only sm:hidden">{menuOpen ? 'Close' : 'Support'}</span>
        </button>
      </div>

      <SupportDialog open={supportOpen} email={email} onClose={() => setSupportOpen(false)} />
      <AssistantDialog open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </>
  )
}

/** One row of the launcher's expanded menu — same filled-pill shape as the
    main button, so the two read as one control rather than a menu bolted on. */
function LauncherOption({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'bg-glare text-ink border-rule-strong flex items-center gap-2.5 border',
        'h-10 px-3.5 text-[0.8125rem] font-medium tracking-[0.01em]',
        'shadow-[0_8px_28px_-8px_rgba(8,28,52,0.35)] transition-colors duration-200',
        'hover:border-ink hover:bg-ink/[0.03] active:translate-y-px',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

/**
 * Native <dialog>, for the same reason the log-in modal is one: Esc, the
 * focus trap, the top layer and the inert page behind are all things the
 * platform already gets right.
 */
function SupportDialog({ open, email, onClose }) {
  const ref = useRef(null)
  const titleId = useId()

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

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className={cx(
        'bg-glare text-ink border-rule m-auto w-[min(31rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] border p-0',
        'backdrop:bg-pit/70 backdrop:backdrop-blur-sm',
      )}
    >
      {/* Mounted only while open, so a request that was sent — or half typed
          and abandoned — is not still sitting there next time. */}
      {open && <SupportPanel titleId={titleId} email={email} onClose={onClose} />}
    </dialog>
  )
}

function SupportPanel({ titleId, email, onClose }) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})
  const [failure, setFailure] = useState('')
  const [status, setStatus] = useState('idle')
  const failureRef = useRef(null)

  // A refused send is the one thing on this panel nobody may miss.
  useEffect(() => {
    if (failure) failureRef.current?.focus()
  }, [failure])

  const remaining = MESSAGE_LIMIT - message.length

  const onSubmit = async (event) => {
    event.preventDefault()

    const found = {}
    if (!subject.trim()) found.subject = 'Give the request a subject.'
    else if (subject.trim().length > SUBJECT_LIMIT) found.subject = `Keep this under ${SUBJECT_LIMIT} characters.`
    if (message.trim().length < MESSAGE_MINIMUM) found.message = 'Tell us a little more about the problem.'
    else if (message.trim().length > MESSAGE_LIMIT) found.message = `Keep this under ${MESSAGE_LIMIT} characters.`

    setErrors(found)
    if (Object.keys(found).length) {
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus())
      return
    }

    setFailure('')
    setStatus('submitting')

    const result = await sendSupportRequest({ subject: subject.trim(), message: message.trim() })

    if (result?.error) {
      setFailure(result.error)
      setStatus('idle')
      return
    }

    setStatus('sent')
  }

  if (status === 'sent') {
    return (
      <div className="animate-reveal px-7 py-9 text-center">
        <span className="bg-cool-600 text-glare mx-auto flex h-12 w-12 items-center justify-center">
          <CheckIcon className="h-6 w-6" />
        </span>
        <h2 id={titleId} className="display-wide text-display-3 mt-5 font-semibold">
          Sent
        </h2>
        <p className="text-ink-soft mx-auto mt-3 max-w-measure text-sm leading-relaxed">
          It is with the team now. The reply comes back to <span className="text-ink font-medium">{email}</span> — check
          the spam folder if it has not arrived by tomorrow.
        </p>
        <Button type="button" variant="outline" size="md" className="mt-7" onClick={onClose}>
          Close
        </Button>
      </div>
    )
  }

  return (
    <div className="animate-reveal flex max-h-[calc(100dvh-2rem)] flex-col">
      <div className="border-rule flex items-start justify-between gap-6 border-b px-7 py-6">
        <div>
          <Eyebrow>Customer support</Eyebrow>
          <h2 id={titleId} className="display-wide text-display-3 mt-3 font-semibold">
            Message the team
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

      <form onSubmit={onSubmit} noValidate className="min-h-0 flex-1 overflow-y-auto px-7 py-7">
        {/* Stated rather than asked. Taking the address from the session is
            what stops a request arriving in somebody else's name, and saying
            so here is cheaper than a field they would have to fill in. */}
        <p className="text-ink-soft border-rule bg-sheet/50 border px-3.5 py-2.5 text-xs leading-relaxed">
          Sent as <span className="text-ink font-mono">{email}</span>, which is where the reply will go.
        </p>

        {failure && (
          <p
            ref={failureRef}
            tabIndex={-1}
            role="alert"
            className="border-hot-600 text-hot-600 mt-4 flex items-start gap-2 border px-3.5 py-2.5 text-sm outline-none"
          >
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            {failure}
          </p>
        )}

        <div className="mt-5 grid gap-5">
          <Field label="Subject" required error={errors.subject}>
            {(props) => (
              <TextInput
                {...props}
                autoFocus
                value={subject}
                maxLength={SUBJECT_LIMIT}
                placeholder="Order 1042 has not shipped"
                onChange={(e) => setSubject(e.target.value)}
              />
            )}
          </Field>

          <Field
            label="What is going on?"
            required
            error={errors.message}
            hint={`Order numbers, model numbers and what you already tried all shorten the reply. ${remaining} characters left.`}
          >
            {(props) => (
              <Textarea
                {...props}
                rows={6}
                value={message}
                maxLength={MESSAGE_LIMIT}
                placeholder="Tell us what happened and what you expected instead."
                onChange={(e) => setMessage(e.target.value)}
              />
            )}
          </Field>
        </div>

        <div className="mt-7 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={status === 'submitting'}>
            Cancel
          </Button>
          <Button type="submit" size="md" disabled={status === 'submitting'}>
            {status === 'submitting' && <SpinnerIcon className="h-4 w-4" />}
            {status === 'submitting' ? 'Sending…' : 'Send to support'}
          </Button>
        </div>
      </form>
    </div>
  )
}
