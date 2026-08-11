'use client'

import { useEffect, useRef, useState } from 'react'
import EnergyFlow from './EnergyFlow.jsx'
import { ArrowLink, Eyebrow, Section, SectionHeading, cx } from './ui.jsx'
import { GridTieIcon, HybridIcon, BatteryIcon } from './icons.jsx'

/**
 * The range as HYXiPOWER actually publishes it. Every number here is read off
 * the manufacturer's datasheet rather than the product page — the pages round
 * and occasionally contradict the PDF, and the PDF is what an installer will
 * be holding when something does not match on site.
 *
 * `datasheet` and `manual` point at HYXiPOWER's own files rather than copies
 * hosted here, so a revision upstream cannot leave this page quietly serving
 * last year's specification.
 */
const FAMILIES = [
  {
    id: 'h-ls',
    icon: HybridIcon,
    series: 'H-LS Series',
    models: 'HYX-H6K-LS · HYX-H8K-LS',
    name: 'Low-voltage hybrid inverter',
    tagline: '48 V battery, single-phase',
    featured: true,
    photo: '/products/h6-8k-ls.png',
    copy: 'Starts making power at 60 V, so the array is working at dawn and still working under cloud. Two AC outputs split critical loads from the rest, up to six units run in parallel, and the 90 – 280 V grid window covers provincial supply that a narrower inverter would trip on.',
    specs: [
      ['Rated output', '6.0 / 8.0 kW'],
      ['Battery voltage', '48 V · 40 – 60 V'],
      ['Max charge / discharge', '125 / 165 A'],
      ['MPPT', '2 × 1 string · 60 – 450 V'],
      ['Grid range', '90 – 280 V'],
      ['Max efficiency', '97.0 %'],
      ['Switch time', '20 ms'],
      ['Enclosure', 'IP66 · 16 kg'],
      ['Warranty', '5 yr'],
    ],
    datasheet: 'https://webfile.hyxipower.com/soft/20260513/HYX-H(6-8)K-LS_Datasheet_V1.3-20260402_EN.pdf',
    manual: 'https://webfile.hyxipower.com/soft/20260618/UM_HYX-H(6-8)K-LS_User-Manual_V1.2-20260608_EN.pdf',
  },
  {
    id: 'h-hs',
    icon: GridTieIcon,
    series: 'H-HS Series',
    models: 'HYX-H6K-HS · HYX-H8K-HS',
    name: 'High-voltage hybrid inverter',
    tagline: 'High-voltage storage, single-phase',
    photo: '/products/h6-8k-hs.png',
    copy: 'The high-voltage half of the same platform: a 80 – 490 V battery bus, 200 % DC oversizing and sub-10 ms transfer. AFCI detection reaches 300 m of string and shuts down in half a second, which is the part that matters on a roof nobody can reach quickly.',
    specs: [
      ['Rated output', '6.0 / 8.0 kW'],
      ['Max apparent power', '6.6 / 8.8 kVA'],
      ['Max PV input', '12.0 / 16.0 kW'],
      ['Battery voltage', '80 – 490 V · LiFePO₄'],
      ['Max charge / discharge', '35 A · 8.0 kW'],
      ['Max efficiency', '98.6 %'],
      ['Switch time', '< 10 ms'],
      ['Enclosure', 'IP65 · 20 kg'],
    ],
    datasheet: 'https://webfile.hyxipower.com/soft/20250226/DS_HYX-H(3-8)K-HS_Datasheet_V1.2-2024_EN.pdf',
    manual: 'https://webfile.hyxipower.com/soft/20250226/UM_HYX-H(3-8)K-HS_User-Manual_V1.4-202407_EN(AU)1.pdf',
  },
  {
    id: 'e-h3',
    icon: BatteryIcon,
    series: 'E-H3 Series',
    models: 'HYX-E50-H3 · HYX-E100-H3',
    name: 'High-voltage battery',
    tagline: 'Wall or floor, stacks to 20 kWh',
    photo: '/products/e50-100-h3.png',
    copy: 'LiFePO₄ packs with the breaker, fuse and cell-temperature sensing already inside, so the install is a mount and a pair of cables rather than a cabinet build. Wall-mounted where there is wall, floor-mounted where there is not.',
    specs: [
      ['Usable capacity', '4.6 / 9.36 kWh'],
      ['Total capacity', '5.12 / 10.4 kWh'],
      ['Nominal voltage', '102.4 / 208 V'],
      ['Cell type', 'LiFePO₄'],
      ['Cycle life', '> 6000 · 70 % EOL'],
      ['Max charge / discharge', '30 A · 60 A for 10 s'],
      ['Enclosure', 'IP65'],
      ['Weight', '56 / 105 kg'],
    ],
    datasheet:
      'https://webfile.hyxipower.com/soft/20260123/DS_HYX-E(50-100)-H3_Datasheet_V1.5-20260120_EN-(Preliminary).pdf',
    manual: 'https://webfile.hyxipower.com/soft/20260429/UM_HYX-E(50-100)-H3_User-manual_V1.6-20260427_EN.pdf',
  },
  {
    id: 'e-l',
    icon: BatteryIcon,
    series: 'E-L Series',
    models: 'HYX-E160-L',
    name: 'Low-voltage battery',
    tagline: '16 kWh a unit, wheel it in',
    photo: '/products/e160-l.png',
    copy: '314 Ah at 51.2 V in a cabinet one person can move on its own wheels, and fifteen of them in parallel if the load asks for it. The commercial answer where a stack of small wall units would be fifteen sets of terminations to inspect.',
    specs: [
      ['Rated energy', '16.07 kWh'],
      ['Rated voltage', '51.2 V DC'],
      ['Rated capacity', '314 Ah'],
      ['Continuous charge / discharge', '157 A'],
      ['Max charge / discharge', '200 A'],
      ['Cycle life', '6000 · 90 % DoD, 80 % SOH'],
      ['Parallel', 'Up to 15 units · 241 kWh'],
      ['Weight', '130 kg'],
    ],
    datasheet: 'https://webfile.hyxipower.com/soft/20260416/HYX-E160-L_Datasheet_V1.0-20260123_EN.pdf',
    manual: 'https://webfile.hyxipower.com/soft/20260513/UM_HYX-E160-L_User-manual_V1.0-20260330_EN.pdf',
  },
]

/**
 * What the header dropdown lists. Derived from FAMILIES rather than restated
 * so the menu and the section can never disagree about what the range is.
 */
export const PRODUCT_NAV = FAMILIES.map(({ id, icon, series, name, tagline }) => ({
  id,
  icon,
  series,
  name,
  tagline,
}))

export default function Products() {
  const [activeId, setActiveId] = useState('h-ls')
  const active = FAMILIES.find((f) => f.id === activeId)
  const tabRefs = useRef([])

  /**
   * The header dropdown links to `#product-h-ls` rather than plain `#products`,
   * so picking a family from the menu lands on that family instead of dumping
   * you at the top of the range to find it again. No element carries that id,
   * which is deliberate — the browser does nothing with the hash and we do the
   * selecting and the scrolling ourselves. It also makes the choice a real URL
   * someone can send to a colleague.
   */
  useEffect(() => {
    const fromHash = () => {
      const match = /^#product-([\w-]+)$/.exec(window.location.hash)
      if (!match) return
      if (!FAMILIES.some((f) => f.id === match[1])) return

      setActiveId(match[1])
      const section = document.getElementById('products')
      if (!section) return
      // An explicit behaviour overrides the stylesheet's reduced-motion reset,
      // so the preference has to be read back here.
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      section.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' })
    }

    fromHash()
    window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
  }, [])

  /**
   * Declaring role="tablist" is a promise that arrow keys move between tabs;
   * without it a keyboard user has to tab through every family to reach the
   * panel. Roving tabindex keeps the whole selector a single tab stop.
   */
  const onTabKeyDown = (event, i) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key]
    let next
    if (step) next = (i + step + FAMILIES.length) % FAMILIES.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = FAMILIES.length - 1
    else return

    event.preventDefault()
    setActiveId(FAMILIES[next].id)
    tabRefs.current[next]?.focus()
  }

  return (
    <Section id="products" className="band-glare">
      <div className="max-w-measure">
        <Eyebrow>Range</Eyebrow>
        <SectionHeading className="mt-6">One platform, roof to switchboard</SectionHeading>
      </div>

      {/* The schematic is the section's claim, so it leads rather than
          decorates. It is wider than a phone, so the scroller is focusable
          and named — otherwise the right half is unreachable by keyboard. */}
      <div
        role="group"
        aria-label="Single-line schematic: array through inverter to loads and grid. Scrollable."
        tabIndex={0}
        className="reveal-up border-rule mt-14 overflow-x-auto pb-2 lg:border-0"
      >
        <EnergyFlow className="h-auto w-[1210px] max-w-none lg:w-full" />
      </div>

      <div className="mt-16 grid gap-px lg:grid-cols-[290px_1fr]">
        {/* ------------------------------ selector ----------------------------- */}
        <div
          role="tablist"
          aria-label="Product families"
          aria-orientation="vertical"
          className="border-rule flex flex-col border-t"
        >
          {FAMILIES.map((f, i) => {
            const on = f.id === activeId
            const Icon = f.icon
            return (
              <button
                key={f.id}
                id={`tab-${f.id}`}
                ref={(el) => {
                  tabRefs.current[i] = el
                }}
                role="tab"
                type="button"
                aria-selected={on}
                aria-controls="product-detail"
                tabIndex={on ? 0 : -1}
                onKeyDown={(e) => onTabKeyDown(e, i)}
                onClick={() => setActiveId(f.id)}
                className={cx(
                  'group border-rule relative flex items-center gap-4 border-b py-5 pr-3 pl-5 text-left transition-colors duration-200',
                  on ? 'bg-sheet' : 'hover:bg-sheet/60',
                )}
              >
                {/* the marker takes the signal blue on the selected family */}
                <span
                  aria-hidden="true"
                  className={cx(
                    'absolute inset-y-0 left-0 w-[3px] transition-colors duration-300',
                    on ? 'bg-cool-600' : 'bg-transparent group-hover:bg-ink/20',
                  )}
                />
                <Icon className={cx('h-6 w-6 shrink-0 transition-colors', on ? 'text-cool-600' : 'text-ink-soft')} />
                <span className="min-w-0">
                  <span className={cx('label block transition-colors', on ? 'text-cool-600' : 'text-ink-soft')}>
                    {f.series}
                  </span>
                  <span
                    className={cx(
                      'mt-1 block text-sm font-medium transition-colors',
                      on ? 'text-ink' : 'text-ink-soft',
                    )}
                  >
                    {f.tagline}
                  </span>
                </span>
                {f.featured && <span className="label text-cool-600 ml-auto shrink-0">Flagship</span>}
              </button>
            )
          })}
        </div>

        {/* ------------------------------- detail ------------------------------ */}
        <div
          id="product-detail"
          role="tabpanel"
          aria-labelledby={`tab-${active.id}`}
          key={active.id}
          className="animate-reveal border-rule bg-sheet border-t border-b lg:border-l"
        >
          <div className="grid gap-10 p-7 sm:p-9 lg:grid-cols-[1fr_auto] lg:gap-8">
            <div className="min-w-0">
              <p className="label text-ink-soft">{active.series}</p>
              <h3 className="display-wide text-display-3 text-ink mt-2.5 font-semibold">{active.name}</h3>
              {/* The model numbers are what gets typed into a quote request, so
                  they are set in the mono face and given their own line rather
                  than buried in the prose. */}
              <p className="text-ink-soft mt-2 font-mono text-sm">{active.models}</p>
              <p className="text-ink-soft max-w-measure mt-4 leading-relaxed">{active.copy}</p>

              {/* the datasheet block, set in the mono that matches the body face */}
              <dl className="border-rule mt-8 border-t">
                {active.specs.map(([k, v]) => (
                  <div key={k} className="border-rule flex items-baseline justify-between gap-6 border-b py-3">
                    <dt className="label text-ink-soft">{k}</dt>
                    <dd className="text-ink font-mono text-sm font-medium tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>

              {/* Two of these leave the site and one does not, so the two that
                  do say where they go. Manufacturer files open in their own tab
                  rather than replacing a page someone was reading. */}
              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                <ArrowLink href={active.datasheet} target="_blank" rel="noopener noreferrer">
                  Datasheet (PDF)
                </ArrowLink>
                <ArrowLink href={active.manual} target="_blank" rel="noopener noreferrer">
                  User manual (PDF)
                </ArrowLink>
                <ArrowLink href="/register">Request a quote</ArrowLink>
              </div>
            </div>

            {/* The photograph is the manufacturer's own, on transparency, so it
                sits on the sheet without carrying a white box of its own. */}
            <div className="hidden shrink-0 items-start justify-center lg:flex">
              <img
                src={active.photo}
                alt={`${active.series} — ${active.name}`}
                className="h-auto w-[196px] object-contain xl:w-[232px]"
              />
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
