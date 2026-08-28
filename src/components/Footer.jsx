import Logo from './Logo.jsx'
import { ADDRESS_LINE, COMPANY } from '@/utils/company'
import { ArrowRightIcon, PhoneIcon } from './icons.jsx'
import Reveal from './Reveal.jsx'

/**
 * The foot of every public page, and the target of every "get a quote" on it.
 *
 * A rounded navy slab sitting on the sky field rather than a full-bleed band
 * clamped to the bottom of the window: the page is made of tiles, and the
 * largest tile is the last one. It opens on the ask — the offer, the two
 * ways to make contact, at the size of a heading — because half the links
 * that arrive here were pressed by somebody who had already decided.
 *
 * Every fact is read from `company.js`, so the address, the numbers and the
 * hours cannot drift from what the rest of the site says.
 */
const EXPLORE = [
  { label: 'Shop everything', href: '/products' },
  { label: 'Inverters', href: '/products/inverters' },
  { label: 'Batteries', href: '/products/batteries' },
  { label: 'Brands we carry', href: '/#brands' },
  { label: 'Your cart', href: '/cart' },
  { label: 'FAQs', href: '/faqs' },
]

const linkClass =
  'text-glint-soft hover:text-glare relative inline-block text-sm transition-colors duration-200 ' +
  'after:bg-solar-400 after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:transition-all ' +
  'after:duration-300 after:ease-out hover:after:w-full'

export default function Footer() {
  return (
    <footer id="footer" className="rail pb-6 lg:pb-10">
      <div className="rail-inner">
        <div className="tile-navy relative overflow-hidden">
          <div
            aria-hidden="true"
            className="bg-solar-500/15 pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full blur-3xl"
          />

          <div className="relative p-7 sm:p-10 lg:p-14">
            {/* ------------------------------- the ask ------------------------------ */}
            <Reveal className="grid gap-8 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <h2 className="text-glare text-[clamp(1.9rem,3.4vw,3rem)] leading-[1.02] font-bold text-balance">
                  Know what you need?{' '}
                  <span className="text-sky-400">Order it in five minutes.</span>
                </h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:col-span-5 lg:justify-end">
                <a
                  href="/products"
                  className="group/cta bg-solar-500 text-navy-950 hover:bg-solar-400 inline-flex h-13 items-center gap-3 rounded-full pr-2 pl-7 text-[0.9375rem] font-semibold transition-colors duration-200"
                >
                  Shop the range
                  <span className="bg-navy-950 text-solar-400 grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform duration-200 group-hover/cta:translate-x-0.5">
                    <ArrowRightIcon className="h-4 w-4" />
                  </span>
                </a>
                <a
                  href={`tel:${COMPANY.phones[0].replace(/[^\d+]/g, '')}`}
                  className="text-glare hover:border-glare/60 inline-flex h-13 items-center justify-center gap-2.5 rounded-full border border-white/25 px-6 font-mono text-sm font-medium transition-colors duration-200"
                >
                  <PhoneIcon className="text-solar-400 h-4 w-4 shrink-0" />
                  {COMPANY.phones[0]}
                </a>
              </div>
            </Reveal>

            <div aria-hidden="true" className="mt-12 h-px w-full bg-white/10" />

            {/* ------------------------------ the detail ---------------------------- */}
            <Reveal className="mt-12 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr] md:gap-10 lg:gap-16">
              <div>
                <Logo tone="shade" />
                <p className="text-glint-soft mt-6 max-w-xs text-sm leading-relaxed">
                  {COMPANY.tagline}. Multi-brand solar equipment supplied across Leyte, Southern Leyte and Cebu — and
                  installed under a duly licensed electrical engineer when you want it installed.
                </p>
                <p className="text-glint-soft/80 mt-6 text-sm leading-relaxed">
                  {ADDRESS_LINE}
                  <br />
                  {COMPANY.hours}
                </p>
              </div>

              <div>
                <p className="label text-glint-soft">Order by phone</p>
                <ul className="mt-4 space-y-2">
                  {COMPANY.phones.map((number) => (
                    <li key={number}>
                      <a
                        href={`tel:${number.replace(/[^\d+]/g, '')}`}
                        className="text-glare hover:text-solar-400 font-mono text-sm transition-colors duration-200"
                      >
                        {number}
                      </a>
                    </li>
                  ))}
                </ul>

                <p className="label text-glint-soft mt-7">Email</p>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="text-glare hover:text-solar-400 mt-4 block font-mono text-sm break-all transition-colors duration-200"
                >
                  {COMPANY.email}
                </a>
              </div>

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

                <p className="label text-glint-soft mt-7">Follow</p>
                <a
                  href={COMPANY.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkClass} mt-4`}
                >
                  Facebook
                </a>
              </div>
            </Reveal>

            <div aria-hidden="true" className="mt-12 h-px w-full bg-white/10" />

            <div className="text-glint-soft/80 mt-8 flex flex-col gap-4 text-xs sm:flex-row sm:items-center sm:justify-between">
              <p>
                © {new Date().getFullYear()} {COMPANY.name}. Trading as {COMPANY.formerName}. All rights reserved.
              </p>
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {['Privacy', 'Terms of sale', 'Cookies', 'Compliance'].map((l) => (
                  <li key={l}>
                    <a href="/faqs" className="hover:text-glare transition-colors duration-200">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
