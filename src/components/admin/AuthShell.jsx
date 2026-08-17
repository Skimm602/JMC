/**
 * The ground the three back-office entry forms stand on.
 *
 * Deliberately not the site's log-in page. That one is a destination with a
 * header, a footer and a paragraph explaining what an account gets you; this
 * one is a door in an unlit corridor. Full-bleed pit, one card, no way out of
 * it except through — there is nothing to browse here.
 *
 * The card itself stays lit. Dark form controls would mean a second set of
 * input styles for four fields, and the palette already covers a lit panel
 * inset into a dark band: focus rings included, which is the part that quietly
 * breaks when a surface gets improvised.
 */
export default function AuthShell({ eyebrow, title, intro, children, footer }) {
  return (
    <main id="content" className="band-pit grid min-h-dvh place-items-center px-5 py-16">
      <div className="w-full max-w-[26rem]">
        {/* Not the site Logo component: that one is a link home, and this
            corridor does not lead back to the showroom. */}
        <div className="flex items-baseline gap-2.5">
          <span className="flex items-baseline">
            <span className="font-display text-glint text-[1.0625rem] leading-none font-bold tracking-[-0.02em]">
              Vip Solar
            </span>
            <span className="font-display text-brand text-[1.0625rem] leading-none font-bold">.</span>
          </span>
          <span className="label text-glint-soft">{eyebrow}</span>
        </div>

        <div className="border-rule bg-glare corner-ticks text-ink mt-6 border p-6 sm:p-8">
          <h1 className="display-wide text-display-3 font-semibold">{title}</h1>
          {intro && <p className="text-ink-soft mt-3 text-sm leading-relaxed">{intro}</p>}

          <div className="mt-7">{children}</div>
        </div>

        {footer && <div className="text-glint-soft mt-6 text-xs leading-relaxed">{footer}</div>}
      </div>
    </main>
  )
}
