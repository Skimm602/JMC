import { Eyebrow, Lede, Section, SectionHeading } from './ui.jsx'
import { HeadsetIcon, MonitorIcon, ShieldIcon, WrenchIcon } from './icons.jsx'

/**
 * Four substantial arguments, icon-fronted, in a grid rather than stacked
 * rows — an entry point someone can scan in a few seconds before deciding
 * whether to read the paragraph.
 *
 * Each is still anchored by the figure that actually settles it. An index
 * number (01, 02, 03) would have carried no information; the measurement is
 * the reason the card exists, so the measurement keeps its size.
 */
const ARGUMENTS = [
  {
    icon: ShieldIcon,
    figure: '45',
    unit: '°C',
    title: 'Thermal headroom by default',
    copy: 'Full rated output held to 45 °C ambient, and the derating curve is published rather than buried in an appendix. Size the system once and stop re-checking it every heatwave.',
  },
  {
    icon: WrenchIcon,
    figure: '1',
    unit: 'pass',
    title: 'Commissioning in one visit',
    copy: 'Bluetooth pairing, guided grid-code selection and an auto-generated handover PDF before the van doors close. No laptop, no dongle, no second visit for paperwork.',
  },
  {
    icon: MonitorIcon,
    figure: '1',
    unit: 'login',
    title: 'The whole fleet in one view',
    copy: 'Every system you commission lands in a single dashboard with alarm routing by site or by crew — not one account per homeowner. There is a read API when you want the data in your own tooling.',
  },
  {
    icon: HeadsetIcon,
    figure: '<4',
    unit: 'h',
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

export default function WhyVip() {
  return (
    <Section id="why" className="band-shade">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Eyebrow tone="shade">Engineering</Eyebrow>
          <SectionHeading className="text-glint mt-6">Specified by engineers, judged by installers</SectionHeading>
        </div>
        <Lede tone="shade" className="lg:col-span-5 lg:self-end">
          Datasheets are easy to win on paper. These are the four things that decide whether a fleet is still profitable
          three summers in.
        </Lede>
      </div>

      {/* No scroll reveal on these four. They are the section's substance, and
          fading body copy in on scroll delays the reading it exists for; the
          hero's drawn curve is the page's one authored moment. */}
      <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ARGUMENTS.map((a) => (
          <article key={a.title} className="border-rule-shade rounded-panel border p-7">
            <a.icon className="text-cool-400 h-7 w-7" />

            <p className="mt-6">
              <span className="text-cool-400 font-mono text-[2.25rem] leading-none font-medium tabular-nums">
                {a.figure}
              </span>
              <span className="text-glint-soft ml-1.5 font-mono text-base">{a.unit}</span>
            </p>

            <h3 className="display-wide text-glint mt-4 text-lg font-semibold">{a.title}</h3>

            <p className="text-glint-soft mt-3 text-sm leading-relaxed">{a.copy}</p>
          </article>
        ))}
      </div>

      {/* the company's own numbers, as display type rather than small chips */}
      <dl className="mt-20 grid grid-cols-2 gap-x-10 gap-y-10 lg:grid-cols-4">
        {NUMBERS.map((n) => (
          <div key={n.label} className="border-rule-shade border-t pt-5">
            <dd className="display-wide text-glint flex items-baseline gap-1 text-[2.5rem] leading-none font-semibold sm:text-5xl">
              {n.value}
              {n.unit && <span className="text-cool-400 text-xl sm:text-2xl">{n.unit}</span>}
            </dd>
            <dt className="label text-glint-soft mt-4">{n.label}</dt>
          </div>
        ))}
      </dl>
    </Section>
  )
}
