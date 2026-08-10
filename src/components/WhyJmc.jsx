import { Eyebrow, Lede, Section, SectionHeading } from './ui.jsx'
import { BoltIcon, WrenchIcon, MonitorIcon, HeadsetIcon } from './icons.jsx'

/**
 * Deliberately laid out as spec-sheet rows rather than a grid of icon cards —
 * four substantial arguments beat six shallow ones, and the oversized outlined
 * numerals carry the hierarchy.
 */
const ARGUMENTS = [
  {
    icon: BoltIcon,
    title: 'Thermal headroom by default',
    copy: 'Full rated output held to 45 °C ambient, and the derating curve is published rather than buried in an appendix. Size the system once and stop re-checking it every heatwave.',
  },
  {
    icon: WrenchIcon,
    title: 'Commissioning in one pass',
    copy: 'Bluetooth pairing, guided grid-code selection and an auto-generated handover PDF before the van doors close. No laptop, no dongle, no second visit for paperwork.',
  },
  {
    icon: MonitorIcon,
    title: 'One dashboard for the whole fleet',
    copy: 'Every system you commission lands in a single view with alarm routing by site or by crew — not one login per homeowner. There is a read API when you want the data in your own tooling.',
  },
  {
    icon: HeadsetIcon,
    title: 'Engineers on the support line',
    copy: 'Technical escalation reaches an applications engineer, not a script. Median first response is under four hours, and replacement units dispatch before the faulty one is collected.',
  },
]

const NUMBERS = [
  { value: '2.4', unit: 'GW', label: 'Shipped capacity' },
  { value: '41', unit: '', label: 'Countries served' },
  { value: '18.4', unit: 'k', label: 'Certified installers' },
  { value: '<24', unit: 'h', label: 'RMA response' },
]

export default function WhyJmc() {
  return (
    <Section id="why" className="bg-ink-950/50">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Eyebrow index="02">Engineering</Eyebrow>
          <SectionHeading className="mt-5">Specified by engineers, judged by installers</SectionHeading>
        </div>
        <Lede className="lg:col-span-5 lg:self-end">
          Datasheets are easy to win on paper. These are the four things that decide whether a fleet is still
          profitable three summers in.
        </Lede>
      </div>

      {/* editorial rows */}
      <div className="mt-16">
        {ARGUMENTS.map((a, i) => {
          const Icon = a.icon
          return (
            <article
              key={a.title}
              className="group border-ink-700/60 grid items-start gap-x-8 gap-y-4 border-t py-9 last:border-b lg:grid-cols-12"
            >
              <div className="flex items-center gap-4 lg:col-span-2">
                <span
                  aria-hidden="true"
                  className="font-display text-4xl font-bold text-transparent transition-all duration-500 group-hover:text-solar-500/20"
                  style={{ WebkitTextStroke: '1px var(--color-ink-600)' }}
                >
                  0{i + 1}
                </span>
                <Icon className="text-solar-400/70 h-5 w-5 transition-colors duration-300 group-hover:text-solar-400 lg:hidden" />
              </div>

              <h3 className="font-display text-lg leading-snug font-semibold text-chalk lg:col-span-4">{a.title}</h3>

              <p className="text-mute text-sm leading-relaxed lg:col-span-6">{a.copy}</p>
            </article>
          )
        })}
      </div>

      {/* numbers, as display type rather than small chips */}
      <dl className="divide-ink-700/60 mt-16 grid grid-cols-2 gap-y-8 lg:grid-cols-4 lg:divide-x">
        {NUMBERS.map((n) => (
          <div key={n.label} className="lg:px-7 lg:first:pl-0">
            <dd className="font-display flex items-baseline gap-1 text-4xl leading-none font-bold text-chalk sm:text-5xl">
              {n.value}
              {n.unit && <span className="text-solar-500 text-xl sm:text-2xl">{n.unit}</span>}
            </dd>
            <dt className="text-mute-dim mt-3 font-mono text-[10px] tracking-[0.16em] uppercase">{n.label}</dt>
          </div>
        ))}
      </dl>
    </Section>
  )
}
