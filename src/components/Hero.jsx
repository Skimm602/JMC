import InverterArt from './InverterArt.jsx'
import { ArrowLink, Button, SpecChip } from './ui.jsx'
import { BoltIcon } from './icons.jsx'

const specs = [
  { label: 'Peak efficiency', value: '98.6%' },
  { label: 'Power range', value: '3–125 kW' },
  { label: 'MPPT trackers', value: '2–6' },
  { label: 'Warranty', value: '12 yr' },
]

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-[68px]">
      {/* technical substrate */}
      <div className="bg-blueprint mask-fade-edges absolute inset-0" aria-hidden="true" />
      <div
        className="bloom-solar pointer-events-none absolute -top-24 right-[-12%] h-[620px] w-[620px]"
        aria-hidden="true"
      />
      <div
        className="bloom-volt pointer-events-none absolute bottom-[-30%] left-[-16%] h-[560px] w-[560px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pt-16 pb-20 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:pt-24 lg:pb-28">
        <div>
          {/* release pill */}
          <div className="border-solar-500/30 bg-solar-500/10 clip-bevel-sm inline-flex items-center gap-2 border px-3 py-1.5">
            <BoltIcon className="text-solar-400 h-3.5 w-3.5" />
            <span className="text-solar-300 font-mono text-[11px] tracking-[0.14em] uppercase">
              New — H6 hybrid series
            </span>
          </div>

          <h1 className="mt-6 text-4xl leading-[1.05] font-bold sm:text-5xl lg:text-[3.75rem]">
            Power conversion built to <span className="text-gradient-solar">outlast the array</span>.
          </h1>

          <p className="text-mute mt-6 max-w-xl text-lg leading-relaxed">
            JMC designs grid-tie, hybrid and storage inverters for residential and commercial solar — engineered
            around the two things installers actually get called back for: thermal headroom and clean
            commissioning.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button as="a" href="#register" size="lg">
              Become a certified installer
            </Button>
            <Button as="a" href="#products" variant="outline" size="lg">
              Explore the range
            </Button>
          </div>

          <div className="mt-10">
            <ArrowLink href="#installers">See what the partner program includes</ArrowLink>
          </div>
        </div>

        {/* product */}
        <div className="relative flex justify-center lg:justify-end">
          <div className="bloom-solar absolute inset-0 scale-125" aria-hidden="true" />
          <InverterArt className="relative h-auto w-[260px] drop-shadow-[0_28px_60px_rgba(0,0,0,0.6)] sm:w-[320px] lg:w-[360px]" />
        </div>
      </div>

      {/* spec rail — technical proof directly under the fold */}
      <div className="border-ink-700/70 bg-ink-950/40 relative border-y">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-5 py-6 sm:px-8 lg:grid-cols-4">
          {specs.map((s) => (
            <SpecChip key={s.label} {...s} />
          ))}
        </dl>
      </div>
    </section>
  )
}
