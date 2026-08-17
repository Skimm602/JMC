'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { askAssistant } from '@/app/actions/assistant'
import { MESSAGE_LIMIT } from '@/utils/assistant/limits'
import { Eyebrow, cx } from './ui.jsx'
import { AlertIcon, ArrowRightIcon, SpinnerIcon, XIcon } from './icons.jsx'
import RobotMascot from './RobotMascot.jsx'

/**
 * The shopping assistant — same native-<dialog> shell as SupportDialog, a
 * chat instead of a form. Unlike the support form this is stateless between
 * opens: closing and reopening starts a fresh conversation, because there is
 * nothing here worth a customer coming back to find half-typed.
 */
export default function AssistantDialog({ open, onClose }) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

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
      {/* Mounted only while open, so every visit starts a clean conversation. */}
      {open && <AssistantPanel titleId={titleId} onClose={onClose} />}
    </dialog>
  )
}

function AssistantPanel({ titleId, onClose }) {
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, pending])

  const send = async (event) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text || pending) return

    setError('')
    const next = [...messages, { role: 'user', text }]
    setMessages(next)
    setDraft('')
    setPending(true)

    const result = await askAssistant(next)
    setPending(false)

    if (result?.error) {
      setError(result.error)
      return
    }

    setMessages((current) => [...current, { role: 'assistant', text: result.reply }])
  }

  return (
    <div className="animate-reveal flex max-h-[calc(100dvh-2rem)] flex-col">
      <div className="border-rule flex items-start justify-between gap-6 border-b px-7 py-6">
        <div className="flex items-start gap-3.5">
          <RobotMascot state={pending ? 'thinking' : 'idle'} className="text-cool-600 h-12 w-12 shrink-0" />
          <div>
            <Eyebrow>Ask, compare, search</Eyebrow>
            <h2 id={titleId} className="display-wide text-display-3 mt-3 font-semibold">
              Assistant
            </h2>
          </div>
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

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
        {messages.length === 0 ? (
          <p className="text-ink-soft text-sm leading-relaxed">
            Ask about a product, compare two options, or search for something we don&rsquo;t sell — this can look
            it up. For orders or accounts, use Customer support instead.
          </p>
        ) : (
          <div className="grid gap-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cx(
                  'max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                  m.role === 'user'
                    ? 'bg-cool-600 text-glare ml-auto'
                    : 'bg-sheet text-ink border-rule border',
                )}
              >
                {m.text}
              </div>
            ))}
          </div>
        )}

        {pending && (
          <div className="text-ink-soft mt-4 flex items-center gap-2 text-xs">
            <RobotMascot state="thinking" className="text-ink-soft h-4 w-4" />
            Thinking…
          </div>
        )}

        {error && (
          <p role="alert" className="border-hot-600 text-hot-600 mt-4 flex items-start gap-2 border px-3.5 py-2.5 text-sm">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
      </div>

      <form onSubmit={send} className="border-rule flex items-end gap-2.5 border-t px-5 py-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(e)
            }
          }}
          maxLength={MESSAGE_LIMIT}
          rows={1}
          autoFocus
          placeholder="Ask the assistant…"
          aria-label="Message"
          className="text-ink placeholder:text-ink-soft max-h-32 min-h-[2.5rem] flex-1 resize-none bg-transparent py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={pending || !draft.trim()}
          aria-label="Send"
          className={cx(
            'bg-cool-600 text-glare grid h-10 w-10 shrink-0 place-items-center transition-colors duration-200',
            'hover:bg-cool-700 disabled:cursor-not-allowed disabled:opacity-45',
          )}
        >
          {pending ? <SpinnerIcon className="h-4 w-4" /> : <ArrowRightIcon className="h-4 w-4" />}
        </button>
      </form>
    </div>
  )
}
