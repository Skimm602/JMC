import { ArrowRightIcon } from './icons.jsx'

/** Small class-name joiner so conditional Tailwind stays readable. */
export const cx = (...parts) => parts.filter(Boolean).join(' ')

/**
 * Numbered section label. The `01 /` prefix borrows from engineering
 * drawings — it's the cheapest way to make a marketing page feel like
 * spec documentation rather than a template.
 */
export function Eyebrow({ index, children, className }) {
  return (
    <p
      className={cx(
        'flex items-center gap-3 font-mono text-xs tracking-[0.22em] text-solar-500 uppercase',
        className,
      )}
    >
      {index && <span className="text-mute-dim">{index}</span>}
      <span className="h-px w-8 bg-solar-500/50" aria-hidden="true" />
      {children}
    </p>
  )
}

export function SectionHeading({ children, className }) {
  return (
    <h2 className={cx('text-3xl leading-[1.1] font-semibold sm:text-4xl lg:text-5xl', className)}>
      {children}
    </h2>
  )
}

export function Lede({ children, className }) {
  return <p className={cx('text-mute max-w-xl text-base leading-relaxed sm:text-lg', className)}>{children}</p>
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50'

const buttonSizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

const buttonVariants = {
  solar:
    'clip-bevel-sm bg-solar-500 text-ink-950 hover:bg-solar-400 hover:shadow-[0_0_28px_-4px_rgba(255,176,32,0.55)]',
  outline:
    'clip-bevel-sm border border-ink-600 text-chalk hover:border-solar-500/60 hover:bg-ink-800 hover:text-solar-300',
  ghost: 'text-mute hover:text-chalk',
}

export function Button({ as = 'button', variant = 'solar', size = 'md', className, children, ...rest }) {
  const Tag = as
  return (
    <Tag className={cx(buttonBase, buttonSizes[size], buttonVariants[variant], className)} {...rest}>
      {children}
    </Tag>
  )
}

/** Link styled as a forward action, with the arrow nudging on hover. */
export function ArrowLink({ href, children, className }) {
  return (
    <a
      href={href}
      className={cx(
        'group text-volt-300 hover:text-solar-400 inline-flex items-center gap-2 text-sm font-medium transition-colors',
        className,
      )}
    >
      {children}
      <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
    </a>
  )
}

/** Thin busbar rule used to separate major bands of the page. */
export function CurrentRule({ className }) {
  return <div aria-hidden="true" className={cx('rule-current h-px w-full opacity-40', className)} />
}

/**
 * Content band. The left padding at lg clears the fixed section-index spine,
 * which is what gives the page its off-centre axis instead of the usual
 * symmetrically-centred column.
 */
export function Section({ id, className, children }) {
  return (
    <section id={id} className={cx('relative px-5 py-20 sm:px-8 lg:py-28 lg:pr-10 lg:pl-[128px]', className)}>
      <div className="mx-auto max-w-[1180px]">{children}</div>
    </section>
  )
}
