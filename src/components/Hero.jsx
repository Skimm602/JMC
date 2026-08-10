
import EnergyFlow from './EnergyFlow.jsx'
import { Button } from './ui.jsx'
import { BoltIcon } from './icons.jsx'

const telemetry = [
  { k: 'Fleet output', v: '412.8 MW' },
  { k: 'Sites online', v: '18,402' },
  { k: 'Grid events 24h', v: '0' },
  { k: 'Firmware', v: '4.8.2' },
]

const ticker = [
  'S4-5K · 5 kW · 2 MPPT · 98.4%',
  'S4-10K · 10 kW · 2 MPPT · 98.4%',
  'H6-8K · 8 kW hybrid · UL 1741-SB',
  'H6-10K · 10 kW hybrid · η 98.6%',
  'V-STACK 15 · 15 kWh LFP · 6000 cyc',
  'M1-800 · 800 W micro · 25 yr',
  'S4-125K · 125 kW · 6 MPPT · 98.8%',
]

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-[68px]">
      <div className="bg-blueprint mask-fade-edges absolute inset-0" aria-hidden="true" />
      <div className="bloom-solar pointer-events-none absolute -top-32 right-[-14%] h-[680px] w-[680px]" aria-hidden="true" />
      <div className="bloom-volt pointer-events-none absolute bottom-[-24%] left-[-18%] h-[560px] w-[560px]" aria-hidden="true" />

      <div className="relative px-5 pt-14 sm:px-8 lg:pt-20 lg:pr-10 lg:pl-[128px]">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-12 lg:grid-cols-[1fr_230px] lg:gap-16">
            {/* ------------------------------ headline ----------------------------- */}
            <div>
              <div className="border-solar-500/30 bg-solar-500/10 clip-bevel-sm inline-flex items-center gap-2 border px-3 py-1.5">
                <BoltIcon className="text-solar-400 h-3.5 w-3.5" />
                <span className="text-solar-300 font-mono text-[11px] tracking-[0.14em] uppercase">
                  New — H6 hybrid series
                </span>
              </div>

              {/* Outlined second line: the type itself carries the design rather
                  than sitting politely next to a product photo. */}
              <h1 className="font-display mt-7 text-[clamp(2.75rem,8.5vw,6.75rem)] leading-[0.85] font-bold tracking-[-0.035em] uppercase">
                <span className="block">Power</span>
                <span
                  className="block text-transparent"
                  style={{ WebkitTextStroke: '1px var(--color-ink-600)' }}
                  aria-hidden="true"
                >
                  Conversion
                </span>
                <span className="sr-only">Conversion</span>
              </h1>

              <p className="font-display mt-5 max-w-lg text-xl leading-snug font-medium sm:text-2xl">
                built to <span className="text-gradient-solar">outlast the array</span> beneath it.
              </p>

              <p className="text-mute mt-6 max-w-lg text-base leading-relaxed">
                Grid-tie, hybrid and storage inverters engineered around the two things installers actually get
                called back for: thermal headroom and clean commissioning.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button as="a" href="#register" size="lg">
                  Become a certified installer
                </Button>
                <Button as="a" href="#products" variant="outline" size="lg">
                  Compare the range
                </Button>
              </div>
            </div>

            {/* ----------------------------- telemetry ---------------------------- */}
            <aside className="border-ink-700/70 lg:border-l lg:pl-7">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                  <span className="bg-good absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" />
                  <span className="bg-good relative inline-flex h-1.5 w-1.5 rounded-full" />
                </span>
                <span className="text-mute-dim font-mono text-[10px] tracking-[0.2em] uppercase">
                  Fleet telemetry
                </span>
              </div>

              <dl className="divide-ink-700/60 mt-5 divide-y">
                {telemetry.map((t) => (
                  <div key={t.k} className="flex items-baseline justify-between gap-4 py-3">
                    <dt className="text-mute-dim font-mono text-[10px] tracking-[0.12em] uppercase">{t.k}</dt>
                    <dd className="font-mono text-sm text-chalk tabular-nums">{t.v}</dd>
                  </div>
                ))}
              </dl>
            </aside>
          </div>
        </div>
      </div>

      {/* -------------------------- energy flow schematic ------------------------- */}
      <div className="relative mt-16 overflow-x-auto lg:pl-[128px]">
        <EnergyFlow className="h-auto w-[1210px] max-w-none lg:w-full" />
      </div>

      {/* ------------------------------- spec ticker ------------------------------ */}
      <div className="border-ink-700/60 bg-ink-950/60 relative mt-10 overflow-hidden border-y py-2.5">
        <div className="animate-ticker flex w-max gap-10" aria-hidden="true">
          {[...ticker, ...ticker].map((t, i) => (
            <span key={i} className="text-mute-dim flex items-center gap-10 font-mono text-[11px] whitespace-nowrap">
              {t}
              <span className="bg-solar-500/60 h-1 w-1 shrink-0 rounded-full" />
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
