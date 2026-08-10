import { ArrowRightIcon } from './icons.jsx'

/** Small class-name joiner so conditional Tailwind stays readable. */
export const cx = (...parts) => parts.filter(Boolean).join(' ')

/**
 * Section label. There is no index number: Range / Engineering / Program /
 * Register is not a sequence, so numbering it would decorate rather than
 * inform. The rule carries the eye instead.
 */
export function Eyebrow({ children, className, tone = 'ink' }) {
  return (
    <p
      className={cx(
        'flex items-center gap-3 font-mono text-[11px] font-medium tracking-[0.24em] uppercase',
        tone === 'shade' ? 'text-glint-soft' : 'text-ink-soft',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cx('h-px w-6', tone === 'shade' ? 'bg-cool-400' : 'bg-hot-600')}
      />
      {children}
    </p>
  )
}

export function SectionHeading({ children, className }) {
  return (
    <h2
      className={cx(
        'display-wide text-[clamp(1.9rem,4.4vw,3.25rem)] leading-[0.98] font-semibold text-balance',
        className,
      )}
    >
      {children}
    </h2>
  )
}

export function Lede({ children, className, tone = 'ink' }) {
  return (
    <p
      className={cx(
        'max-w-xl text-base leading-relaxed sm:text-[1.0625rem]',
        tone === 'shade' ? 'text-glint-soft' : 'text-ink-soft',
        className,
      )}
    >
      {children}
    </p>
  )
}

/* --------------------------------- button --------------------------------- */

const buttonBase =
  'group/btn relative inline-flex items-center justify-center gap-2.5 font-medium tracking-[0.01em] transition-[background-color,color,border-color,transform] duration-200 disabled:cursor-not-allowed disabled:opacity-45 active:translate-y-px'

const buttonSizes = {
  sm: 'px-4 py-2 text-[0.8125rem]',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-[0.9375rem]',
}

/**
 * Hover travels along the temperature axis rather than just brightening —
 * the micro-interaction means the same thing the palette does.
 */
const buttonVariants = {
  hot: 'bg-hot-600 text-glare hover:bg-hot-500',
  outline: 'border border-ink/30 text-ink hover:border-hot-600 hover:text-hot-600',
  outlineShade: 'border border-glint/25 text-glint hover:border-cool-400 hover:text-cool-400',
  ghost: 'text-ink-soft hover:text-hot-600',
  ghostShade: 'text-glint-soft hover:text-cool-400',
}

export function Button({ as = 'button', variant = 'hot', size = 'md', className, children, ...rest }) {
  const Tag = as
  return (
    <Tag className={cx(buttonBase, buttonSizes[size], buttonVariants[variant], className)} {...rest}>
      {children}
    </Tag>
  )
}

/** Link styled as a forward action, with the arrow nudging on hover. */
export function ArrowLink({ href, children, className, tone = 'ink' }) {
  return (
    <a
      href={href}
      className={cx(
        'group inline-flex items-center gap-2 text-sm font-medium transition-colors',
        tone === 'shade' ? 'text-cool-400 hover:text-glint' : 'text-cool-600 hover:text-hot-600',
        className,
      )}
    >
      <span className="border-b border-current/35 pb-px transition-colors group-hover:border-current">
        {children}
      </span>
      <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
    </a>
  )
}

/** Hairline separating blocks within a band. */
export function Rule({ className, tone = 'ink' }) {
  return (
    <div
      aria-hidden="true"
      className={cx('h-px w-full', tone === 'shade' ? 'bg-glint/15' : 'bg-ink/15', className)}
    />
  )
}

/**
 * Content band. The left padding at lg clears the fixed section index,
 * which is what gives the page its off-centre axis instead of the usual
 * symmetrically-centred column.
 */
export function Section({ id, className, children }) {
  return (
    <section id={id} className={cx('relative px-5 py-24 sm:px-8 lg:py-32 lg:pr-10 lg:pl-[128px]', className)}>
      <div className="mx-auto max-w-[1180px]">{children}</div>
    </section>
  )
}
