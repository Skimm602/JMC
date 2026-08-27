import Logo from './Logo.jsx'
import { Rule } from './ui.jsx'
import Reveal from './Reveal.jsx'

/**
 * The foot of every public page.
 *
 * Left-aligned to the same datum the rest of the site is built on, rather
 * than centred. A centred column floating in a wide dark band was the reason
 * this read as empty: the page has a spine, and the footer was the one place
 * that stepped off it.
 *
 * Three columns carry what a footer is actually for — who this is, how to
 * reach them, and where else to go — so the width does some work instead of
 * being margin.
 *
 * The only motion is `<Reveal>`, the fade-up used elsewhere on the site. The
 * global reduced-motion rule collapses its transition to near-nothing for
 * anyone who has asked for less motion. A footer is not the place to spend a
 * visitor's attention on anything more than that.
 */

/** Real destinations only. A column of links that all point at "/" is worse
    than no column — it costs a click to learn it was decorative. */
const EXPLORE = [
  { label: 'Products by category', href: '/#products' },
  { label: 'Products and pricing', href: '/products' },
  { label: 'FAQs', href: '/faqs' },
]

/** Answered by a person, so they are dial-able rather than decorative — half
    the people reading this are holding the phone they would call from. */
const NUMBERS = ['0917 508 8220', '0949 954 8439', '(053) 520-2459']

const EMAIL = 'jmcsolarph@gmail.com'

/** Underline grows from the left on hover rather than appearing all at once —
    the same movement the site's ArrowLink makes, at a smaller size. */
const linkClass =
  'text-glint-soft hover:text-glint relative inline-block text-sm transition-colors duration-200 ' +
  'after:bg-brand after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:transition-all ' +
  'after:duration-300 after:ease-out hover:after:w-full'

export default function Footer() {
  return (
    <footer id="footer" className="band-pit rail">
      <div className="rail-inner pt-20 pb-32 lg:py-24 lg:pb-28">
        <Reveal className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr] md:gap-10 lg:gap-16">
          {/* ------------------------------- who ------------------------------- */}
          <div>
            <Logo tone="shade" />
            <p className="text-glint-soft max-w-xs mt-6 text-sm leading-relaxed">
              Grid-tie, hybrid and storage inverters for residential and commercial solar. Engineered for the people
              who have to service them.
            </p>
          </div>

          {/* ------------------------------ reach ------------------------------ */}
          <div>
            <p className="label text-glint-soft">Trade desk</p>
            <ul className="mt-4 space-y-2">
              {NUMBERS.map((number) => (
                <li key={number}>
                  <a
                    href={`tel:${number.replace(/[^\d+]/g, '')}`}
                    className="text-glint hover:text-brand font-mono text-sm transition-colors duration-200"
                  >
                    {number}
                  </a>
                </li>
              ))}
            </ul>

            <p className="label text-glint-soft mt-7">Email</p>
            <a
              href={`mailto:${EMAIL}`}
              className="text-glint hover:text-brand mt-4 block font-mono text-sm break-all transition-colors duration-200"
            >
              {EMAIL}
            </a>
          </div>

          {/* ------------------------------ where ------------------------------ */}
          <div>
            <p className="label text-glint-soft">Explore</p>
            <ul className="mt-4 space-y-2.5">
              {EXPLORE.map(({ label, href }) => (
                <li key={href}>
                  <a href={href} className={linkClass}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Rule tone="shade" className="mt-12 mb-8" />

        {/* The graduations along the bottom edge, read from both ends. They
            carry no information — they are the instrument-panel voice the rest
            of the site is drawn in, and the one place a footer can hold it
            without adding another thing to read. aria-hidden for that reason. */}
        <div aria-hidden="true" className="text-rule-shade flex items-end gap-6">
          <span className="scale-marks h-3 flex-1" />
          <span className="scale-marks scale-marks-end h-3 flex-1" />
        </div>

        <div className="text-glint-soft mt-8 flex flex-col gap-4 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Vip Solar. All rights reserved.</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {['Privacy', 'Terms of sale', 'Cookies', 'Compliance'].map((l) => (
              <li key={l}>
                <a href="/" className="hover:text-glint transition-colors duration-200">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
