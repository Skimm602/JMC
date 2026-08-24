'use client'

import { useEffect, useRef, useState } from 'react'
import EnergyFlow from './EnergyFlow.jsx'
import { ArrowLink, Eyebrow, Section, SectionHeading, cx } from './ui.jsx'

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

  /* ------------------------------------------------------------------------
   * The second-source brands. Same rule as above: every figure is read off
   * the manufacturer's own datasheet, and `models` names only the ratings the
   * catalogue actually carries — not every rating the series is published in
   * — so the menu never offers a unit the shop cannot quote.
   * --------------------------------------------------------------------- */
  {
    id: 'lux-gen2-3-6k',
    series: 'LuxpowerTek GEN2-LB-EU 3-6K',
    models: 'GEN2-LB-EU 6K',
    name: 'Low-voltage hybrid inverter',
    tagline: 'Generator, smart load or AC coupling',
    photo: '/products/luxpowertek-gen2-lb-eu-6k.webp',
    copy: 'One dedicated port covers a generator, a smart load or AC coupling onto an existing grid-tie array, so a retrofit does not mean replacing what is already on the roof. Two MPPTs reach 9.6 kW, ten units run in parallel, and the transfer to backup is 7 ms.',
    specs: [
      ['Rated output', '6.0 kW'],
      ['Max PV input', '9.6 kW'],
      ['Battery voltage', '48 V · 40 – 60 V'],
      ['Max charge / discharge', '125 / 140 A'],
      ['MPPT', '2 × 1 string · 150 – 425 V'],
      ['Max efficiency', '97.3 %'],
      ['Switch time', '7 ms'],
      ['Enclosure', 'IP66 · 25 kg'],
      ['Warranty', '5 / 10 yr'],
    ],
    datasheet: 'https://luxpowertek.com/wp-content/uploads/2025/10/GEN2-LB-EU-3-6K-Datasheet.pdf',
    manual:
      'https://luxpowertek.com/wp-content/uploads/2025/12/LuxpowerTek-GEN2-LB-EU-3-6K-User-manual-ENGLISH-Hybrid-SINGLE-Phase-inverter.pdf',
  },
  {
    id: 'lux-gen2-7-14k',
    series: 'LuxpowerTek GEN2-LB-EU 7-14K',
    models: 'GEN2-LB-EU 10K · GEN2-LB-EU 12K',
    name: 'Low-voltage hybrid inverter',
    tagline: 'Three MPPTs, 18 kW of array',
    photo: '/products/luxpowertek-gen2-lb-eu-7-14k-front.webp',
    copy: 'The larger GEN2 platform: three independent MPPTs carrying 18 kW of array, 250 A of battery current, and automatic generator control that will exercise and boost the set rather than only start it. Tariff-aware charging shifts the load to the cheap hours on its own.',
    specs: [
      ['Rated output', '10.0 / 12.0 kW'],
      ['Max PV input', '18.0 kW'],
      ['Battery voltage', '48 V · 40 – 60 V'],
      ['Max charge / discharge', '147 – 250 A'],
      ['MPPT', '3 × 1 string · 120 – 440 V'],
      ['Switch time', '10 ms · 20 ms parallel'],
      ['Parallel', 'Up to 10 units'],
      ['Enclosure', 'IP66 · 47.5 kg'],
      ['Warranty', '5 / 10 yr'],
    ],
    datasheet: 'https://luxpowertek.com/wp-content/uploads/2026/02/GEN2-LB-EU-7-14K-Datasheet20260206.pdf',
    manual: 'https://luxpowertek.com/wp-content/uploads/2026/03/GEN2-LB-EU-7-14K-User-Manual-2025.7.1.pdf',
  },
  {
    id: 'solis-s6-3-10k',
    series: 'Solis S6-EH1P (3-10)K-L-PLUS',
    models: 'S6-EH1P 6K · S6-EH1P 8K',
    name: 'Low-voltage hybrid inverter',
    tagline: 'Runs on any 40 – 60 V battery',
    photo: '/products/solis-s6-eh1p-3-10k-l-plus.png',
    copy: 'Battery-agnostic across the whole 40 – 60 V band, so the pack is a commercial decision rather than a locked one. Takes 160 % of its own DC rating in array, holds 200 % overload for ten seconds to start a pump or a compressor, and hands over to backup in under 10 ms.',
    specs: [
      ['Rated output', '6.0 / 8.0 kW'],
      ['Max usable PV input', '9.6 / 12.8 kW'],
      ['Battery voltage', '40 – 60 V'],
      ['Max charge / discharge', '135 / 190 A'],
      ['MPPT', '2 · 90 – 435 V'],
      ['Max efficiency', '96.2 %'],
      ['Switch time', '< 10 ms'],
      ['Parallel', 'Up to 6 units'],
      ['Enclosure', 'IP66 · 23 kg'],
    ],
    datasheet: 'https://www.solisinverters.com/uploads/file/S6-EH1P(3-10)K-PH-Flyer-V2,0.pdf',
    manual: 'https://www.solisinverters.com/uploads/file/Solis_Manual_S6-EH1P(3-8)K-L-PLUS_EUR_V1,3(20260402).pdf',
  },
  {
    id: 'solis-s6-12-18k',
    series: 'Solis S6-EH1P (12-18)K-L',
    models: 'S6-EH1P 12K · S6-EH1P 16K',
    name: 'Low-voltage hybrid inverter',
    tagline: 'Large residential, generator ready',
    photo: '/products/solis-s6-eh1p-12-18k-l.png',
    copy: 'Three MPPTs at 40 A apiece, sized for the 182 mm and 210 mm cells rather than derating them. Built for the large house that still keeps a generator: automatic multi-method generator control, 90 A of AC passthrough, and redundant fan cooling so one failed fan is not a stopped inverter.',
    specs: [
      ['Rated output', '12.0 / 16.0 kW'],
      ['Max usable PV input', '19.2 / 25.6 kW'],
      ['Battery voltage', '40 – 60 V'],
      ['Max charge / discharge', '250 / 290 A'],
      ['MPPT', '3 · 80 – 520 V'],
      ['Max efficiency', '97.6 %'],
      ['Switch time', '< 10 ms'],
      ['Parallel', 'Up to 6 units'],
      ['Enclosure', 'IP66 · 55.5 kg'],
    ],
    datasheet: 'https://www.solisinverters.com/uploads/file/S6-EH1P(12-18)K-PH-Flyer-V2,1.pdf',
    manual:
      'https://www.solisinverters.com/uploads/file/Solis_Manual_S6-EH1P(12-18)K03-NV-YD-L_EUR_V1,3(20251030).pdf',
  },
  {
    id: 'goodwe-es-uniq',
    series: 'GoodWe ES Uniq Series',
    models: 'GW6000-ES-C10 · GW12K-ES-C10',
    name: 'Low-voltage hybrid inverter',
    tagline: 'One port, three jobs',
    photo: '/products/goodwe-es-uniq.png',
    copy: 'A single 3-in-1 port takes a generator, a smart load or an existing grid-tie inverter, which is one termination to make instead of three. Transfer to backup is under 4 ms — fast enough that a desktop machine does not notice — and the AFCI detects the arc rather than waiting for a current threshold.',
    specs: [
      ['Rated output', '6.0 / 12.0 kW'],
      ['Max PV input', '12.0 / 24.0 kW'],
      ['Battery voltage', '48 V · 40 – 60 V'],
      ['Max charge / discharge', '140 / 240 A'],
      ['MPPT', '2 · 60 – 550 V'],
      ['Max efficiency', '97.6 %'],
      ['Switch time', '< 4 ms'],
      ['Parallel', 'Up to 6 units'],
      ['Enclosure', 'IP66 · 15.5 / 29 kg'],
    ],
    datasheet: 'https://en.goodwe.com/Skippower/downloadFileF?id=2373&mid=60',
    manual: 'https://en.goodwe.com/Skippower/downloadFileF?id=2923&mid=60',
  },
  {
    id: 'solax-t-bat-d150',
    series: 'SolaX T-BAT-SYS-LV D150',
    models: 'T-BAT-SYS-LV D150',
    name: 'Low-voltage battery',
    tagline: '15 kWh a unit, 16 in parallel',
    photo: '/products/solax-t-bat-sys-lv-d150.png',
    copy: '15 kWh in one floor-standing LFP cabinet, 13.5 kWh of it usable, and sixteen of them on a single 48 V bus if the site asks for it. The 310 A ten-second peak is what carries a motor start, and faults are readable remotely rather than off a panel somebody has to walk to.',
    specs: [
      ['Nominal energy', '15.0 kWh'],
      ['Usable energy', '13.5 kWh · 90 % DoD'],
      ['Rated capacity', '314 Ah'],
      ['Nominal voltage', '48 V · 42 – 54 V'],
      ['Max charge / discharge', '155 A'],
      ['Peak discharge', '310 A · 10 s'],
      ['Cycle life', '> 6000 · 90 % DoD'],
      ['Parallel', 'Up to 16 units · 240 kWh'],
      ['Enclosure', 'IP65 · 125 kg'],
    ],
    datasheet: 'https://www.solaxpower.com/uploads/file/solax-t-bat-sys-lv-d150-datasheet-en.pdf',
  },
]

/**
 * What the header dropdown lists. Derived from FAMILIES rather than restated
 * so the menu and the section can never disagree about what the range is.
 */
export const PRODUCT_NAV = FAMILIES.map(({ id, series, models, name, photo }) => ({
  id,
  series,
  models,
  name,
  photo,
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
                {/* The unit itself rather than a glyph for its category: these
                    are four objects an installer recognises on sight, and a
                    thumbnail says which one faster than any label can. */}
                <img
                  src={f.photo}
                  alt=""
                  loading="lazy"
                  className={cx(
                    'h-12 w-12 shrink-0 object-contain transition-opacity duration-200',
                    on ? 'opacity-100' : 'opacity-65 group-hover:opacity-100',
                  )}
                />
                <span className="min-w-0">
                  <span
                    className={cx(
                      'block font-mono text-[0.8125rem] font-medium transition-colors',
                      on ? 'text-ink' : 'text-ink-soft',
                    )}
                  >
                    {f.models}
                  </span>
                  <span className={cx('mt-1 block text-sm transition-colors', on ? 'text-cool-600' : 'text-ink-soft')}>
                    {f.name}
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
            <div className="order-2 min-w-0 lg:order-1">
              <p className="label text-ink-soft">{active.series}</p>
              {/* The model number is the heading, not a footnote to it: it is
                  what goes on the quote, the permit and the wall, and what
                  someone is checking this page against. */}
              <h3 className="display-wide text-display-3 text-ink mt-2.5 font-semibold text-balance">
                {active.models}
              </h3>
              <p className="text-cool-600 mt-2 text-sm font-medium">{active.name}</p>
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
                {/* Not every manufacturer publishes an installation manual at
                    a stable public URL — SolaX does not — so the link appears
                    only where there is genuinely a file behind it. */}
                {active.manual && (
                  <ArrowLink href={active.manual} target="_blank" rel="noopener noreferrer">
                    User manual (PDF)
                  </ArrowLink>
                )}
                <ArrowLink href="/products">See prices and order</ArrowLink>
              </div>
            </div>

            {/* The photograph is the manufacturer's own, on transparency, so it
                sits on the sheet without carrying a white box of its own. It
                leads on a phone and sits beside the specification on a desk —
                the picture is half of what someone came to this panel for, so
                it is not the thing that gets dropped on a narrow screen. */}
            <div className="order-1 flex shrink-0 items-start justify-center lg:order-2">
              <img
                src={active.photo}
                alt={`${active.models} — ${active.name}`}
                className="h-auto w-[190px] object-contain sm:w-[220px] lg:w-[196px] xl:w-[232px]"
              />
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
