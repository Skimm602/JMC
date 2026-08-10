import { Eyebrow, Lede, Section, SectionHeading } from './ui.jsx'
import { ShieldIcon, WrenchIcon, MonitorIcon, BoltIcon, HeadsetIcon, BatteryIcon } from './icons.jsx'

const features = [
  {
    icon: BoltIcon,
    title: 'Thermal headroom by default',
    copy: 'Full rated output held to 45 °C ambient. The derating curve is published, not buried — size once and move on.',
  },
  {
    icon: WrenchIcon,
    title: 'Commissioning in one pass',
    copy: 'Bluetooth pairing, guided grid-code selection and an auto-generated handover PDF before you leave the roof.',
  },
  {
    icon: MonitorIcon,
    title: 'Fleet monitoring, not per-site logins',
    copy: 'Every system you install lands in one dashboard, with alarm routing and a read API for your own tooling.',
  },
  {
    icon: BatteryIcon,
    title: 'Storage that is already paired',
    copy: 'V-Stack modules ship pre-matched to H6 firmware, so battery commissioning is a checkbox rather than a project.',
  },
  {
    icon: ShieldIcon,
    title: '12-year standard warranty',
    copy: 'Extendable to 20. Advance-replacement units dispatch before the faulty one is collected.',
  },
  {
    icon: HeadsetIcon,
    title: 'Engineers on the support line',
    copy: 'Technical escalation reaches an applications engineer, not a script. Median first-response under four hours.',
  },
]

const numbers = [
  { value: '2.4 GW', label: 'Shipped capacity' },
  { value: '41', label: 'Countries served' },
  { value: '18,400', label: 'Certified installers' },
  { value: '< 24 h', label: 'RMA response' },
]

export default function WhyJmc() {
  return (
    <Section id="why" className="bg-ink-950/50">
      <div className="max-w-2xl">
        <Eyebrow index="02">Why JMC</Eyebrow>
        <SectionHeading className="mt-5">Specified by engineers, judged by installers</SectionHeading>
        <Lede className="mt-5">
          Datasheets are easy to win on paper. These are the things that decide whether a fleet stays profitable
          three summers in.
        </Lede>
      </div>

      <div className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, copy }) => (
          <div key={title} className="group relative pl-14">
            <span className="border-ink-700 bg-ink-850 clip-bevel-sm text-solar-400 group-hover:border-solar-500/50 group-hover:bg-solar-500/10 absolute top-0 left-0 grid h-10 w-10 place-items-center border transition-colors duration-300">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="text-base font-semibold text-chalk">{title}</h3>
            <p className="text-mute mt-2 text-sm leading-relaxed">{copy}</p>
          </div>
        ))}
      </div>

      {/* numbers band */}
      <div className="border-ink-700 clip-bevel bg-ink-850/60 mt-16 border">
        <dl className="divide-ink-700 grid grid-cols-2 divide-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {numbers.map((n) => (
            <div key={n.label} className="px-6 py-7 text-center">
              <dt className="text-mute-dim order-2 mt-1.5 font-mono text-[10px] tracking-[0.16em] uppercase">
                {n.label}
              </dt>
              <dd className="font-display text-2xl font-bold text-chalk sm:text-3xl">{n.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  )
}
