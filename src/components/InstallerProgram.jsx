import { Button, CurrentRule, Eyebrow, Lede, Section, SectionHeading } from './ui.jsx'
import { CheckIcon, InfoIcon } from './icons.jsx'

const tiers = [
  {
    name: 'Registered',
    requirement: 'Open to all trade accounts',
    perks: ['Trade pricing tier 1', 'Datasheet + CAD library', 'Standard 12-yr warranty', 'Email support'],
  },
  {
    name: 'Certified',
    requirement: 'Requires verified licence + training',
    featured: true,
    perks: [
      'Trade pricing tier 2',
      'Advance-replacement RMA',
      'Named applications engineer',
      'Fleet monitoring dashboard',
      'Co-marketing on our installer map',
    ],
  },
  {
    name: 'Master',
    requirement: 'By invitation, 250 kW+ installed',
    perks: ['Best available pricing', 'Firmware early access', 'Design review on tenders', 'Priority stock allocation'],
  },
]

const documents = [
  'Business registration or trade licence',
  'Electrical contractor licence (or your electrician’s)',
  'Public liability insurance certificate',
  'Any solar/PV certifications your team holds',
]

export default function InstallerProgram() {
  return (
    <Section id="installers" className="relative overflow-hidden">
      <div
        className="bloom-volt pointer-events-none absolute top-[-20%] left-[-10%] h-[480px] w-[480px]"
        aria-hidden="true"
      />

      <div className="relative max-w-2xl">
        <Eyebrow index="03">Installer program</Eyebrow>
        <SectionHeading className="mt-5">Built around your crew, not our catalogue</SectionHeading>
        <Lede className="mt-5">
          Three tiers, no volume traps. Registration is free and takes a few minutes — certification is where the
          real margin sits.
        </Lede>
      </div>

      <div className="relative mt-14 grid gap-5 lg:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`clip-bevel flex flex-col border p-7 ${
              t.featured
                ? 'border-solar-500/45 bg-gradient-to-b from-solar-500/[0.08] to-ink-850 shadow-[0_0_60px_-30px_rgba(255,176,32,0.5)]'
                : 'border-ink-700 bg-ink-850/70'
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-xl font-bold text-chalk">{t.name}</h3>
              {t.featured && (
                <span className="text-solar-300 border-solar-500/40 border px-2 py-0.5 font-mono text-[9px] tracking-[0.14em] uppercase">
                  Most partners
                </span>
              )}
            </div>
            <p className="text-mute-dim mt-2 font-mono text-[11px] tracking-wide">{t.requirement}</p>

            <CurrentRule className="my-6" />

            <ul className="flex flex-1 flex-col gap-3">
              {t.perks.map((p) => (
                <li key={p} className="flex gap-3 text-sm text-chalk/90">
                  <CheckIcon className={`mt-0.5 h-4 w-4 shrink-0 ${t.featured ? 'text-solar-400' : 'text-volt-400'}`} />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* What to have ready — set expectations before the form asks for uploads. */}
      <div className="border-volt-500/25 bg-volt-500/[0.06] clip-bevel relative mt-12 border p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <InfoIcon className="text-volt-300 mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h3 className="text-base font-semibold text-chalk">Applying as an installer? Have these ready</h3>
              <p className="text-mute mt-1.5 text-sm">
                Only needed if you tick the installer box — buyers and homeowners can register without any of it.
              </p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {documents.map((d) => (
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
