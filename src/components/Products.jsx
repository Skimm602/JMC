'use client'

import { useState } from 'react'
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
    <Section id="products">
      <div className="max-w-2xl">
        <Eyebrow index="01">Product range</Eyebrow>
        <SectionHeading className="mt-5">One platform, roof to switchboard</SectionHeading>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-12">
        {/* ------------------------------ selector ----------------------------- */}
        <div role="tablist" aria-label="Product families" className="border-ink-700/70 flex flex-col border-t">
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
                  'group border-ink-700/70 relative flex items-center gap-4 border-b py-4 pr-3 pl-4 text-left transition-colors duration-200',
                  on ? 'bg-solar-500/[0.06]' : 'hover:bg-ink-850/60',
                )}
              >
                {/* active marker rides the left edge */}
                <span
                  aria-hidden="true"
                  className={cx(
                    'absolute inset-y-0 left-0 w-[2px] transition-all duration-300',
                    on ? 'bg-solar-500' : 'bg-transparent',
                  )}
                />
                <Icon className={cx('h-6 w-6 shrink-0 transition-colors', on ? 'text-solar-400' : 'text-mute-dim')} />
                <span className="min-w-0">
                  <span
                    className={cx(
                      'block font-mono text-[10px] tracking-[0.16em] uppercase transition-colors',
                      on ? 'text-solar-400' : 'text-mute-dim',
                    )}
                  >
                    {f.series}
                  </span>
                  <span className={cx('block text-sm font-medium transition-colors', on ? 'text-chalk' : 'text-mute')}>
                    {f.tagline}
                  </span>
                </span>
                {f.featured && (
                  <span className="text-solar-300/80 ml-auto shrink-0 font-mono text-[9px] tracking-[0.12em] uppercase">
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
          className="animate-reveal border-ink-700 bg-ink-850/60 clip-bevel border p-7 sm:p-9"
        >
          <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:gap-10">
            <div>
              <p className="text-mute-dim font-mono text-[10px] tracking-[0.18em] uppercase">{active.series}</p>
              <h3 className="font-display mt-2 text-2xl font-bold text-chalk">{active.name}</h3>
              <p className="text-mute mt-4 max-w-md text-sm leading-relaxed">{active.copy}</p>

              <dl className="divide-ink-700/70 mt-7 divide-y border-y border-ink-700/70">
                {active.specs.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-6 py-2.5">
                    <dt className="text-mute-dim font-mono text-[10px] tracking-[0.12em] uppercase">{k}</dt>
                    <dd className="font-mono text-sm text-chalk tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-7 flex flex-wrap gap-6">
                <ArrowLink href="#register">Datasheet</ArrowLink>
                <ArrowLink href="#register">Request a quote</ArrowLink>
              </div>
            </div>

            {active.art && (
              <div className="relative hidden shrink-0 items-start justify-center sm:flex">
                <div className="bloom-solar absolute inset-0 scale-150" aria-hidden="true" />
                <InverterArt className="relative h-auto w-[150px] drop-shadow-[0_18px_40px_rgba(0,0,0,0.55)] lg:w-[180px]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Section>
  )
}
