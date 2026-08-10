import { Button, Eyebrow, Lede, Section, SectionHeading, cx } from './ui.jsx'
import { CheckIcon, InfoIcon } from './icons.jsx'

const TIERS = [
  { name: 'Registered', req: 'Open to all trade accounts' },
  { name: 'Certified', req: 'Verified licence + training', featured: true },
  { name: 'Master', req: 'By invitation · 250 kW+ installed' },
]

/** [row label, registered, certified, master] — string renders as text, true as a tick. */
const MATRIX = [
  ['Trade pricing', 'Tier 1', 'Tier 2', 'Best available'],
  ['Datasheet + CAD library', true, true, true],
  ['Firmware library', true, true, true],
  ['Advance-replacement RMA', false, true, true],
  ['Named applications engineer', false, true, true],
  ['Fleet monitoring dashboard', false, true, true],
  ['Listed on our installer map', false, true, true],
  ['Firmware early access', false, false, true],
  ['Design review on tenders', false, false, true],
  ['Priority stock allocation', false, false, true],
]

const DOCUMENTS = [
  'Business registration or trade licence',
  'Electrical contractor licence',
  'Public liability insurance certificate',
  'Any PV certifications your team holds',
]

function Cell({ value, featured }) {
  if (value === true)
    return (
      <CheckIcon
        className={cx('mx-auto h-4 w-4', featured ? 'text-solar-400' : 'text-volt-400')}
        aria-label="Included"
      />
    )
  if (value === false)
    return (
      <span className="text-ink-600 mx-auto block text-center" aria-label="Not included">
        —
      </span>
    )
  return <span className="block text-center font-mono text-xs text-chalk">{value}</span>
}

export default function InstallerProgram() {
  return (
    <Section id="installers" className="relative overflow-hidden">
      <div className="bloom-volt pointer-events-none absolute top-[-25%] left-[-12%] h-[480px] w-[480px]" aria-hidden="true" />

      <div className="relative grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Eyebrow index="03">Installer program</Eyebrow>
          <SectionHeading className="mt-5">Built around your crew, not our catalogue</SectionHeading>
        </div>
        <Lede className="lg:col-span-5 lg:self-end">
          Three tiers, no volume traps. Registration is free — certification is where the margin actually sits.
        </Lede>
      </div>

      {/* ------------------------- comparison matrix ------------------------- */}
      <div className="relative mt-14 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <caption className="sr-only">Benefits included at each installer tier</caption>
          <thead>
            <tr>
              <th scope="col" className="w-[38%] pb-5 text-left align-bottom">
                <span className="text-mute-dim font-mono text-[10px] tracking-[0.16em] uppercase">Benefit</span>
              </th>
              {TIERS.map((t) => (
                <th
                  key={t.name}
                  scope="col"
                  className={cx(
                    'border-b-2 px-4 pb-5 align-bottom',
                    t.featured ? 'border-solar-500' : 'border-ink-700',
                  )}
                >
                  <span
                    className={cx(
                      'font-display block text-lg font-bold',
                      t.featured ? 'text-solar-400' : 'text-chalk',
                    )}
                  >
                    {t.name}
                  </span>
                  <span className="text-mute-dim mt-1.5 block font-mono text-[10px] leading-relaxed tracking-wide">
                    {t.req}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX.map(([label, ...values]) => (
              <tr key={label} className="border-ink-700/50 border-b">
                <th scope="row" className="py-3.5 pr-4 text-left text-sm font-normal text-chalk/90">
                  {label}
                </th>
                {values.map((v, i) => (
                  <td
                    key={i}
                    className={cx('px-4 py-3.5', TIERS[i].featured && 'bg-solar-500/[0.05]')}
                  >
                    <Cell value={v} featured={TIERS[i].featured} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --------------- what to have ready before the form ----------------- */}
      <div className="border-volt-500/25 bg-volt-500/[0.06] clip-bevel relative mt-12 border p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <InfoIcon className="text-volt-300 mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h3 className="text-base font-semibold text-chalk">Applying as an installer? Have these ready</h3>
              <p className="text-mute mt-1.5 text-sm">
                Only needed if you tick the installer box — buyers and homeowners register without any of it.
              </p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {DOCUMENTS.map((d) => (
                  <li key={d} className="text-mute flex gap-2.5 text-sm">
                    <span className="bg-volt-400/70 mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" aria-hidden="true" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <Button as="a" href="#register" className="shrink-0 self-start">
            Start registration
          </Button>
        </div>
      </div>
    </Section>
  )
}
