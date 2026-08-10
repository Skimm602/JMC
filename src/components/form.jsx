'use client'

import { useId } from 'react'
import { cx } from './ui.jsx'
import { AlertIcon, ChevronDownIcon, CheckIcon } from './icons.jsx'

const controlBase =
  'w-full bg-glare border px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors duration-200 outline-none'

const controlState = (invalid) =>
  invalid
    ? 'border-hot-600 focus:border-hot-600'
    : 'border-ink/25 hover:border-ink/45 focus:border-cool-600'

/**
 * Label + control + hint/error wrapper. Wires up `htmlFor`, `aria-invalid`
 * and `aria-describedby` from one place so every field stays accessible
 * without repeating the plumbing.
 */
export function Field({ label, required, hint, error, children, className, span }) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={cx(span === 2 && 'sm:col-span-2', className)}>
      <label htmlFor={id} className="text-ink mb-2 block font-mono text-[10px] tracking-[0.14em] uppercase">
        {label}
        {required && (
          <span className="text-hot-600 ml-1" aria-hidden="true">
            *
          </span>
        )}
        {!required && <span className="text-ink-faint ml-1.5">optional</span>}
      </label>

      {children({ id, invalid: Boolean(error), describedBy })}

      {hint && !error && (
        <p id={hintId} className="text-ink-faint mt-2 text-xs leading-relaxed">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-hot-600 mt-2 flex items-center gap-1.5 text-xs">
          <AlertIcon className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

export function TextInput({ id, invalid, describedBy, ...rest }) {
  return (
    <input
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cx(controlBase, controlState(invalid))}
      {...rest}
    />
  )
}

export function Select({ id, invalid, describedBy, children, ...rest }) {
  return (
    <div className="relative">
      <select
        id={id}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cx(controlBase, controlState(invalid), 'appearance-none pr-10')}
        {...rest}
      >
        {children}
      </select>
      <ChevronDownIcon className="text-ink-faint pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
    </div>
  )
}

/**
 * Checkbox with a drawn box rather than the native control, so it matches
 * the square geometry the rest of the page uses. The real input stays in the
 * DOM (visually hidden) to keep keyboard and screen-reader behaviour intact.
 *
 * `tone="hot"` marks the one box that changes what the form asks for.
 */
export function Checkbox({ checked, onChange, label, description, name, tone = 'cool', error }) {
  const id = useId()
  const descId = description ? `${id}-desc` : undefined

  return (
    <div>
      <label htmlFor={id} className="group flex cursor-pointer items-start gap-3">
        <span className="relative mt-0.5 grid h-5 w-5 shrink-0 place-items-center">
          <input
            id={id}
            name={name}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            aria-describedby={descId}
            aria-invalid={error ? true : undefined}
            className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none"
          />
          <span
            className={cx(
              'pointer-events-none grid h-5 w-5 place-items-center border transition-colors duration-200',
              checked
                ? tone === 'hot'
                  ? 'border-hot-600 bg-hot-600 text-glare'
                  : 'border-cool-600 bg-cool-600 text-glare'
                : error
                  ? 'border-hot-600 bg-glare'
                  : 'border-ink/35 bg-glare group-hover:border-ink/60',
              'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-hot-600',
            )}
          >
            {checked && <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.6} />}
          </span>
        </span>

        <span className="min-w-0">
          <span className="text-ink block text-sm font-medium">{label}</span>
          {description && (
            <span id={descId} className="text-ink-soft mt-1.5 block text-xs leading-relaxed">
              {description}
            </span>
          )}
        </span>
      </label>
      {error && (
        <p role="alert" className="text-hot-600 mt-2 flex items-center gap-1.5 pl-8 text-xs">
          <AlertIcon className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
