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
    <p className={cx('chip', tone === 'shade' ? 'chip-shade' : 'chip-solar', className)}>
      <span
        aria-hidden="true"
        className={cx('h-1.5 w-1.5 shrink-0 rounded-full', tone === 'shade' ? 'bg-solar-400' : 'bg-solar-500')}
      />
      {children}
    </p>
  )
}

/**
 * The page's display voice: two words, two weights of the same blue.
 *
 * The pale half is `--color-sky-500` rather than a tint of the navy, so the
 * heading reads as one phrase lit from two distances instead of as a heading
 * with a faded word in it. Both halves are one <h_>, so it is still a single
 * heading to a screen reader.
 */
export function TwoTone({ light, dark, className }) {
  return (
    <>
      <span className={cx('text-sky-500', className)}>{light}</span>{' '}
      <span className={cx('text-navy-900', className)}>{dark}</span>
    </>
  )
}

export function SectionHeading({ children, className }) {
  return <h2 className={cx('text-display-2 text-navy-900 font-bold text-balance', className)}>{children}</h2>
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
  'group/btn relative inline-flex items-center justify-center gap-2.5 rounded-full font-semibold tracking-[0.01em] transition-[background-color,color,border-color,box-shadow,transform] duration-200 disabled:cursor-not-allowed disabled:opacity-45 active:translate-y-px'

const buttonSizes = {
  sm: 'h-10 px-4 text-[0.8125rem]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-[0.9375rem]',
}

/**
 * Only the primary action carries a filled colour, and it carries the blue
 * pole — the brand voice. Secondary controls resolve toward ink rather than
 * borrowing a pole for a hover state, and `hot` is kept for an action that
 * is genuinely about heat or risk rather than for every call to action.
 */
const buttonVariants = {
  /* The page's committed action. Navy on the light field, the way the
     reference sets it — the amber is kept for the header's single CTA and
     for the accents inside dark tiles, so it never has to compete with
     itself twice in one viewport. */
  primary: 'bg-navy-900 text-glare hover:bg-navy-800 shadow-[0_10px_24px_-14px_rgba(15,31,64,0.9)]',
  solar:
    'bg-solar-500 text-navy-950 hover:bg-solar-400 shadow-[0_10px_24px_-12px_rgba(245,158,11,0.9)]',
  glare: 'bg-glare text-navy-900 hover:bg-sky-200 shadow-[0_10px_24px_-16px_rgba(15,31,64,0.8)]',
  cool: 'bg-cool-600 text-glare hover:bg-cool-700',
  hot: 'bg-hot-600 text-glare hover:bg-hot-700',
  outline: 'border border-navy-900/25 bg-glare/60 text-navy-900 hover:border-navy-900/60 hover:bg-glare',
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
export function ArrowLink({ href, children, className, tone = 'ink', ...rest }) {
  return (
    <a
      href={href}
      {...rest}
      className={cx(
        'group inline-flex items-center gap-2 text-sm font-medium transition-colors',
        tone === 'shade' ? 'text-glint-soft hover:text-glint' : 'text-ink-soft hover:text-ink',
        className,
      )}
    >
      <span className="border-b border-current/40 pb-px transition-colors group-hover:border-current">{children}</span>
      <ArrowRightIcon
        aria-hidden="true"
        className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
      />
    </a>
  )
}

/**
 * Orientation trail for a page nested more than one level deep. The current
 * page is the last item and never a link — it names where you are, not
 * where you could go.
 */
export function Breadcrumb({ items, className }) {
  return (
    <nav aria-label="Breadcrumb" className={cx('flex flex-wrap items-center gap-2 text-sm', className)}>
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <span key={item.label} className="flex items-center gap-2">
            {i > 0 && (
              <span aria-hidden="true" className="text-ink-soft/60">
                /
              </span>
            )}
            {last || !item.href ? (
              <span className={last ? 'text-ink' : 'text-ink-soft'}>{item.label}</span>
            ) : (
              <a href={item.href} className="text-ink-soft hover:text-ink transition-colors">
                {item.label}
              </a>
            )}
          </span>
        )
      })}
    </nav>
  )
}

/** Hairline separating blocks within a band. */
export function Rule({ className, tone = 'ink' }) {
  return (
    <div aria-hidden="true" className={cx('h-px w-full', tone === 'shade' ? 'bg-rule-shade' : 'bg-rule', className)} />
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
    <section id={id} className={cx('rail relative py-20 lg:py-28', className)}>
      <div className="rail-inner">{children}</div>
    </section>
  )
}
