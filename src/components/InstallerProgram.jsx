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

function Cell({ value }) {
  if (value === true) return <CheckIcon className="text-cool-600 mx-auto h-4 w-4" aria-label="Included" />
  if (value === false)
    return (
      <span className="text-ink-soft mx-auto block text-center" aria-label="Not included">
        —
      </span>
    )
  return <span className="text-ink block text-center font-mono text-xs">{value}</span>
}

export default function InstallerProgram() {
  return (
    <Section id="installers" className="band-glare">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Eyebrow>Installer program</Eyebrow>
          <SectionHeading className="mt-6">Built around your crew, not our catalogue</SectionHeading>
        </div>
        <Lede className="lg:col-span-5 lg:self-end">
          Three tiers, no volume traps. Registration is free — certification is where the margin actually sits.
        </Lede>
      </div>

      {/* ------------------------- comparison matrix -------------------------
          The benefit column stays pinned while the tiers scroll on narrow
          screens, so a tick is never stranded from the row it belongs to. */}
      <div className="mt-16 overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <caption className="sr-only">Benefits included at each installer tier</caption>
          <thead>
            <tr>
              <th scope="col" className="bg-glare sticky left-0 z-10 w-[38%] pr-4 pb-5 text-left align-bottom">
                <span className="label text-ink-soft">Benefit</span>
              </th>
              {TIERS.map((t) => (
                <th
                  key={t.name}
                  scope="col"
                  className={cx(
                    'px-4 pb-5 align-bottom',
                    t.featured ? 'border-cool-600 border-b-2' : 'border-rule-strong border-b',
                  )}
                >
                  <span
                    className={cx(
                      'display-wide block text-lg font-semibold',
                      t.featured ? 'text-cool-600' : 'text-ink',
                    )}
                  >
                    {t.name}
                  </span>
                  <span className="text-ink-soft mt-2 block font-mono text-[11px] leading-relaxed tracking-wide">
                    {t.req}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX.map(([label, ...values]) => (
              <tr key={label} className="border-rule border-b">
                {/* The separator stays while the column is stuck, at every
                    width. Dropping it at sm left the pinned benefit column
                    floating over the scrolled tiers with no edge. */}
                <th
                  scope="row"
                  className="bg-glare border-rule text-ink sticky left-0 z-10 border-r py-3.5 pr-4 text-left text-sm font-normal"
                >
                  {label}
                </th>
                {values.map((v, i) => (
                  <td key={i} className={cx('px-4 py-3.5', TIERS[i].featured && 'bg-sheet')}>
                    <Cell value={v} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --------------- what to have ready before the form ----------------- */}
      <div className="border-cool-600/35 bg-cool-600/[0.06] mt-14 border p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <InfoIcon className="text-cool-600 mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h3 className="text-ink text-base font-semibold">Applying as an installer? Have these ready</h3>
              <p className="text-ink-soft mt-2 text-sm">
                Only needed if you tick the installer box — buyers and homeowners register without any of it.
              </p>
              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {DOCUMENTS.map((d) => (
                  <li key={d} className="text-ink-soft flex gap-3 text-sm">
                    <span aria-hidden="true" className="bg-cool-600 mt-[9px] h-px w-3 shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <Button as="a" href="/register" className="shrink-0 self-start">
            Start registration
          </Button>
        </div>
      </div>
    </Section>
  )
}
