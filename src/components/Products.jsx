'use client'

import { useState } from 'react'
import EnergyFlow from './EnergyFlow.jsx'
import InverterArt from './InverterArt.jsx'
import { ArrowLink, Eyebrow, Section, SectionHeading, cx } from './ui.jsx'
import { GridTieIcon, HybridIcon, BatteryIcon, MicroIcon } from './icons.jsx'

const FAMILIES = [
  {
    id: 's4',
    icon: GridTieIcon,
    series: 'S4 Series',
    name: 'Grid-tie string inverters',
    tagline: 'The volume workhorse',
    art: true,
    copy: 'Single- and three-phase units with a wide MPPT window, sized for everything from a shaded terrace roof to a 125 kW commercial run. The one your crew will fit most weeks.',
    specs: [
      ['Power range', '3 – 125 kW'],
      ['Phases', '1φ / 3φ'],
      ['MPPT trackers', '2 – 6'],
      ['Peak efficiency', '98.4 %'],
      ['Max DC input', '1100 V'],
      ['Enclosure', 'IP66'],
    ],
  },
  {
    id: 'h6',
    icon: HybridIcon,
    series: 'H6 Series',
    name: 'Hybrid inverters',
    tagline: 'Storage-ready conversion',
    featured: true,
    art: true,
    copy: 'Sub-10 ms islanding, so backup transfer never trips sensitive loads. Pre-paired with V-Stack firmware — battery commissioning becomes a checkbox rather than a project.',
    specs: [
      ['Power range', '4 – 12 kW'],
      ['Battery voltage', '48 V DC'],
      ['Backup transfer', '< 10 ms'],
      ['Peak efficiency', '98.6 %'],
      ['Standard', 'UL 1741-SB'],
      ['Enclosure', 'IP65'],
    ],
  },
  {
    id: 'vstack',
    icon: BatteryIcon,
    series: 'V-Stack',
    name: 'Battery storage',
    tagline: 'Stack it as the job grows',
    art: false,
    copy: 'LFP modules in 5 kWh steps to 40 kWh. Same connector set and same commissioning app as the inverters, so nothing about the install is a separate skill.',
    specs: [
      ['Capacity', '5 – 40 kWh'],
      ['Chemistry', 'LFP'],
      ['Cycle life', '6000 @ 80% DoD'],
      ['Round-trip', '96 %'],
      ['Modularity', '5 kWh steps'],
      ['Warranty', '10 yr'],
    ],
  },
  {
    id: 'm1',
    icon: MicroIcon,
    series: 'M1 Series',
    name: 'Microinverters',
    tagline: 'For roofs that fight back',
    art: false,
    copy: 'Panel-level conversion with per-module reporting. The retrofit answer when the geometry is awkward enough that string design stops being worth the argument.',
    specs: [
      ['Output', '400 – 800 W'],
      ['Panels per unit', '1 – 2'],
      ['Peak efficiency', '97.2 %'],
      ['Monitoring', 'Per-panel'],
      ['Enclosure', 'IP67'],
      ['Warranty', '25 yr'],
    ],
  },
]

export default function Products() {
  const [activeId, setActiveId] = useState('h6')
  const active = FAMILIES.find((f) => f.id === activeId)

  return (
    <Section id="products" className="band-sheet">
      <div className="max-w-2xl">
        <Eyebrow>Range</Eyebrow>
        <SectionHeading className="mt-6">One platform, roof to switchboard</SectionHeading>
      </div>

      {/* The schematic is the section's claim, so it leads rather than decorates. */}
      <div className="reveal-up mt-14 overflow-x-auto pb-2">
        <EnergyFlow className="h-auto w-[1210px] max-w-none lg:w-full" />
      </div>

      <div className="mt-16 grid gap-px lg:grid-cols-[290px_1fr]">
        {/* ------------------------------ selector ----------------------------- */}
        <div role="tablist" aria-label="Product families" className="border-ink/15 flex flex-col border-t">
          {FAMILIES.map((f) => {
            const on = f.id === activeId
            const Icon = f.icon
            return (
              <button
                key={f.id}
                role="tab"
                type="button"
                aria-selected={on}
                aria-controls="product-detail"
                onClick={() => setActiveId(f.id)}
                className={cx(
                  'group border-ink/15 relative flex items-center gap-4 border-b py-5 pr-3 pl-5 text-left transition-colors duration-200',
                  on ? 'bg-glare' : 'hover:bg-glare/60',
                )}
              >
                {/* the marker heats up on the selected family */}
                <span
                  aria-hidden="true"
                  className={cx(
                    'absolute inset-y-0 left-0 w-[3px] transition-colors duration-300',
                    on ? 'bg-hot-600' : 'bg-transparent group-hover:bg-ink/20',
                  )}
                />
                <Icon className={cx('h-6 w-6 shrink-0 transition-colors', on ? 'text-hot-600' : 'text-ink-faint')} />
                <span className="min-w-0">
                  <span
                    className={cx(
                      'block font-mono text-[10px] tracking-[0.18em] uppercase transition-colors',
                      on ? 'text-hot-600' : 'text-ink-faint',
                    )}
                  >
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
                {f.featured && (
                  <span className="text-cool-600 ml-auto shrink-0 font-mono text-[9px] tracking-[0.14em] uppercase">
                    Flagship
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ------------------------------- detail ------------------------------ */}
        <div
          id="product-detail"
          role="tabpanel"
          key={active.id}
          className="animate-reveal border-ink/15 bg-glare border-t border-b lg:border-l"
        >
          <div className="grid gap-10 p-7 sm:p-9 lg:grid-cols-[1fr_auto] lg:gap-8">
            <div className="min-w-0">
              <p className="text-ink-faint font-mono text-[10px] tracking-[0.2em] uppercase">{active.series}</p>
              <h3 className="display-wide text-ink mt-2.5 text-2xl font-semibold">{active.name}</h3>
              <p className="text-ink-soft mt-4 max-w-md leading-relaxed">{active.copy}</p>

              {/* the datasheet block, set in the mono that matches the body face */}
              <dl className="border-ink/15 mt-8 border-t">
                {active.specs.map(([k, v]) => (
                  <div
                    key={k}
                    className="border-ink/15 flex items-baseline justify-between gap-6 border-b py-3"
                  >
                    <dt className="text-ink-soft font-mono text-[11px] tracking-[0.12em] uppercase">{k}</dt>
                    <dd className="text-ink font-mono text-sm font-medium tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
                <ArrowLink href="#register">Datasheet</ArrowLink>
                <ArrowLink href="#register">Request a quote</ArrowLink>
              </div>
            </div>

            {active.art && (
              <div className="hidden shrink-0 items-start justify-center lg:flex">
                <InverterArt className="h-auto w-[168px] xl:w-[196px]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Section>
  )
}
