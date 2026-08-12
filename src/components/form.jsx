'use client'

import { useId } from 'react'
import { cx } from './ui.jsx'
import { AlertIcon, ChevronDownIcon, CheckIcon } from './icons.jsx'

const controlBase =
  'w-full bg-glare border px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft transition-colors duration-200 outline-none'

/**
 * Focus resolves toward ink rather than the cool pole. Cool means verified
 * and in-spec everywhere else on the page; an empty field that merely has
 * the caret in it has not been verified of anything.
 */
const controlState = (invalid) =>
  invalid ? 'border-hot-600 focus:border-hot-600' : 'border-rule-strong hover:border-ink-soft focus:border-ink'

/**
 * Label + control + hint/error wrapper. Wires up `htmlFor`, `aria-invalid`,
 * `aria-describedby` and the required state from one place so every field
 * stays accessible without repeating the plumbing.
 *
 * The asterisk is decorative and stays `aria-hidden`; `required` is what
 * actually reaches a screen reader, and it used to be missing entirely — so
 * the mandatory fields on the form this whole site exists for announced as
 * optional.
 */
export function Field({ label, required, hint, error, children, className, span }) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={cx(span === 2 && 'sm:col-span-2', className)}>
      <label htmlFor={id} className="label text-ink mb-2 block">
        {label}
        {required && (
          <span className="text-hot-600 ml-1" aria-hidden="true">
            *
          </span>
        )}
        {!required && <span className="text-ink-soft ml-1.5 normal-case">optional</span>}
      </label>

      {children({ id, invalid: Boolean(error), describedBy, required: Boolean(required) })}

      {hint && !error && (
        <p id={hintId} className="text-ink-soft mt-2 text-xs leading-relaxed">
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

/**
 * `className` is merged rather than spread over the base: passing one through
 * `...rest` would land after the base string and replace the control's entire
 * appearance, which is a silent way to lose the border, the focus state and
 * the padding all at once.
 */
export function TextInput({ id, invalid, describedBy, required, className, ...rest }) {
  return (
    <input
      id={id}
      required={required || undefined}
      aria-required={required || undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      {...rest}
      className={cx(controlBase, controlState(invalid), className)}
    />
  )
}

export function Select({ id, invalid, describedBy, required, children, ...rest }) {
  return (
    <div className="relative">
      <select
        id={id}
        required={required || undefined}
        aria-required={required || undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cx(controlBase, controlState(invalid), 'appearance-none pr-10')}
        {...rest}
      >
        {children}
      </select>
      <ChevronDownIcon
        aria-hidden="true"
        className="text-ink-soft pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2"
      />
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
                  : 'border-rule-strong bg-glare group-hover:border-ink-soft',
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
