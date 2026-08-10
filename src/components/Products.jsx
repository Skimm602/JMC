import { Eyebrow, Lede, Section, SectionHeading, ArrowLink } from './ui.jsx'
import { GridTieIcon, HybridIcon, BatteryIcon, MicroIcon } from './icons.jsx'

const products = [
  {
    icon: GridTieIcon,
    series: 'S4 Series',
    name: 'Grid-tie string inverters',
    copy: 'Single- and three-phase residential units with a wide MPPT window for split or shaded roofs.',
    specs: ['3–20 kW', '2 MPPT', '98.4% peak'],
    accent: 'volt',
  },
  {
    icon: HybridIcon,
    series: 'H6 Series',
    name: 'Hybrid inverters',
    copy: 'Storage-ready conversion with sub-10 ms islanding, so backup transfer never trips sensitive loads.',
    specs: ['4–12 kW', '48 V DC', 'UL 1741-SB'],
    accent: 'solar',
    featured: true,
  },
  {
    icon: BatteryIcon,
    series: 'V-Stack',
    name: 'Battery storage',
    copy: 'Stackable LFP modules from 5 to 40 kWh, pre-paired to H6 so commissioning stays a one-screen job.',
    specs: ['5–40 kWh', 'LFP', '6000 cycles'],
    accent: 'volt',
  },
  {
    icon: MicroIcon,
    series: 'M1 Series',
    name: 'Microinverters',
    copy: 'Panel-level conversion with per-module reporting — the retrofit answer for complex roof geometry.',
    specs: ['400–800 W', 'Per-panel', '25 yr'],
    accent: 'volt',
  },
]

export default function Products() {
  return (
    <Section id="products">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Eyebrow index="01">Product range</Eyebrow>
          <SectionHeading className="mt-5">One platform, roof to switchboard</SectionHeading>
        </div>
        <Lede className="lg:text-right">
          Every JMC unit shares the same commissioning app, the same monitoring backend and the same connector
          set — so what your crew learns on one job transfers to the next.
        </Lede>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map(({ icon: Icon, ...p }) => (
          <article
            key={p.series}
            className={`clip-bevel group relative border p-6 transition-all duration-300 ${
              p.featured
                ? 'border-solar-500/40 bg-gradient-to-b from-solar-500/[0.07] to-ink-850'
                : 'border-ink-700 bg-ink-850/70 hover:border-ink-600'
            } hover:-translate-y-1`}
          >
            {p.featured && (
              <span className="bg-solar-500 text-ink-950 absolute top-0 right-0 px-2 py-1 font-mono text-[9px] font-medium tracking-[0.14em] uppercase">
                Flagship
              </span>
            )}

            <Icon
              className={`h-8 w-8 ${p.accent === 'solar' ? 'text-solar-400' : 'text-volt-400'} transition-transform duration-300 group-hover:scale-110`}
            />

            <p className="text-mute-dim mt-5 font-mono text-[10px] tracking-[0.18em] uppercase">{p.series}</p>
            <h3 className="mt-1.5 text-lg font-semibold text-chalk">{p.name}</h3>
            <p className="text-mute mt-3 text-sm leading-relaxed">{p.copy}</p>

            <ul className="border-ink-700/80 mt-5 flex flex-wrap gap-x-3 gap-y-1.5 border-t pt-4">
              {p.specs.map((s) => (
                <li key={s} className="text-mute-dim font-mono text-[11px]">
                  {s}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-10">
        <ArrowLink href="#register">Request the full datasheet pack</ArrowLink>
      </div>
    </Section>
  )
}
