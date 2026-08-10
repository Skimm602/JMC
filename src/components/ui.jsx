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
        'label flex items-center gap-3 font-medium',
        tone === 'shade' ? 'text-glint-soft' : 'text-ink-soft',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cx('h-px w-6 shrink-0', tone === 'shade' ? 'bg-cool-400' : 'bg-cool-600')}
      />
      {children}
    </p>
  )
}

export function SectionHeading({ children, className }) {
  return (
    <h2 className={cx('display-wide text-display-2 font-semibold text-balance', className)}>
      {children}
    </h2>
  )
}

export function Lede({ children, className, tone = 'ink' }) {
  return (
    <p
      className={cx(
        'max-w-measure text-base leading-relaxed sm:text-[1.0625rem]',
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
 * Only the primary action carries a filled colour, and it carries the blue
 * pole — the brand voice. Secondary controls resolve toward ink rather than
 * borrowing a pole for a hover state, and `hot` is kept for an action that
 * is genuinely about heat or risk rather than for every call to action.
 */
const buttonVariants = {
  primary: 'bg-cool-600 text-glare hover:bg-cool-700',
  hot: 'bg-hot-600 text-glare hover:bg-hot-700',
  outline: 'border border-rule-strong text-ink hover:border-ink hover:bg-ink/[0.04]',
  outlineShade: 'border border-rule-shade text-glint hover:border-glint-soft hover:bg-glint/[0.06]',
  ghost: 'text-ink-soft hover:text-ink',
  ghostShade: 'text-glint-soft hover:text-glint',
}

export function Button({ as = 'button', variant = 'primary', size = 'md', className, children, ...rest }) {
  const Tag = as
  return (
    <Tag className={cx(buttonBase, buttonSizes[size], buttonVariants[variant], className)} {...rest}>
      {children}
    </Tag>
  )
}

/**
 * Link styled as a forward action. The underline and the arrow carry the
 * affordance, so a secondary navigation link no longer has to borrow a pole
 * of a two-colour palette that means something specific elsewhere.
 */
export function ArrowLink({ href, children, className, tone = 'ink' }) {
  return (
    <a
      href={href}
      className={cx(
        'group inline-flex items-center gap-2 text-sm font-medium transition-colors',
        tone === 'shade' ? 'text-glint-soft hover:text-glint' : 'text-ink-soft hover:text-ink',
        className,
      )}
    >
      <span className="border-b border-current/40 pb-px transition-colors group-hover:border-current">
        {children}
      </span>
      <ArrowRightIcon
        aria-hidden="true"
        className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
      />
    </a>
  )
}

/** Hairline separating blocks within a band. */
export function Rule({ className, tone = 'ink' }) {
  return (
    <div
      aria-hidden="true"
      className={cx('h-px w-full', tone === 'shade' ? 'bg-rule-shade' : 'bg-rule', className)}
    />
  )
}

/**
 * Content band. `rail` puts the content's left edge on the page datum at
 * every width and caps the measure; `rail-inner` stops the line growing with
 * the window. Header, hero, form and footer use the same pair, so the page
 * reads off one axis instead of the four left edges it used to have above
 * 1348px, where the old centred inner column drifted away from the header.
 */
export function Section({ id, className, children }) {
  return (
    <section id={id} className={cx('rail relative py-24 lg:py-32 xl:py-40', className)}>
      <div className="rail-inner">{children}</div>
    </section>
  )
}
