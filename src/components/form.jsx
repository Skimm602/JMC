'use client'

import { useId } from 'react'
import { cx } from './ui.jsx'
import { AlertIcon, ChevronDownIcon, CheckIcon } from './icons.jsx'

const controlBase =
  'w-full bg-ink-900/70 border px-3.5 py-2.5 text-sm text-chalk placeholder:text-mute-dim/70 transition-colors duration-200 outline-none clip-bevel-sm'

const controlState = (invalid) =>
  invalid
    ? 'border-bad/70 focus:border-bad'
    : 'border-ink-600 hover:border-ink-600/80 focus:border-solar-500 focus:bg-ink-900'

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
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium tracking-wide text-chalk/90">
        {label}
        {required && (
          <span className="text-solar-500 ml-1" aria-hidden="true">
            *
          </span>
        )}
        {!required && <span className="text-mute-dim ml-1.5 font-normal">(optional)</span>}
      </label>

      {children({ id, invalid: Boolean(error), describedBy })}

      {hint && !error && (
        <p id={hintId} className="text-mute-dim mt-1.5 text-xs leading-relaxed">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-bad mt-1.5 flex items-center gap-1.5 text-xs">
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
      <ChevronDownIcon className="text-mute-dim pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
    </div>
  )
}

/**
 * Checkbox with a drawn box rather than the native control, so it can carry
 * the same bevel language as the rest of the UI. The real input stays in the
 * DOM (visually hidden) to keep keyboard and screen-reader behaviour intact.
 */
export function Checkbox({ checked, onChange, label, description, name, tone = 'default', error }) {
  const id = useId()
  const descId = description ? `${id}-desc` : undefined

  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
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
              'clip-bevel-sm pointer-events-none grid h-5 w-5 place-items-center border transition-all duration-200',
              checked
                ? tone === 'solar'
                  ? 'border-solar-500 bg-solar-500 text-ink-950'
                  : 'border-volt-500 bg-volt-500 text-ink-950'
                : error
                  ? 'border-bad/70 bg-ink-900'
                  : 'border-ink-600 bg-ink-900 peer-hover:border-mute-dim',
              'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-solar-400',
            )}
          >
            {checked && <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.6} />}
          </span>
        </span>

        <span className="min-w-0">
          <span className="block text-sm font-medium text-chalk">{label}</span>
          {description && (
            <span id={descId} className="text-mute mt-1 block text-xs leading-relaxed">
              {description}
            </span>
          )}
        </span>
      </label>
      {error && (
        <p role="alert" className="text-bad mt-2 flex items-center gap-1.5 pl-8 text-xs">
          <AlertIcon className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
