import { Lede, Section, SectionHeading } from './ui.jsx'
import { BoxIcon, ChartIcon, FileIcon, LayersIcon, TagIcon, TruckIcon } from './icons.jsx'
import Reveal from './Reveal.jsx'

/**
 * What it is like to actually buy and stock from VIP Solar, rather than the
 * engineering case for the hardware itself. Every point here is a real,
 * checkable feature of the site or the program already built elsewhere
 * (`Catalogue.jsx`'s live stock and published pricing, `InstallerProgram.jsx`'s
 * tiers, the real brands listed in `Products.jsx`) — nothing here is a number
 * invented for this section.
 *
 * Icon beside text rather than the old rule-and-heading list — the pairing
 * entelechypower.com uses for its own "why choose us" band. Each icon reads
 * the point in one glance before the sentence explains it: a stack of layers
 * for a multi-brand range, a tag for a price shown rather than quoted, a
 * crate for stock that is real rather than a PDF.
 */
const POINTS = [
  {
    label: 'Multi-brand range',
    copy: 'Our own HYXiPOWER platform, plus LuxpowerTek, Solis, GoodWe and SolaX — one supplier instead of five.',
    icon: LayersIcon,
  },
  {
    label: 'Three installer tiers',
    copy: 'Registered, Certified and Master. Trade pricing, RMA turnaround and stock priority scale with the tier, not the invoice.',
    icon: ChartIcon,
  },
  {
    label: 'Published pricing',
    copy: 'List and trade prices shown on every product page — no quote request needed just to find out what something costs.',
    icon: TagIcon,
  },
  {
    label: 'Live stock, not a catalogue PDF',
    copy: 'Every unit shows in stock, low stock or out, updated with every order rather than a figure someone remembers to revise.',
    icon: BoxIcon,
  },
  {
    label: "The manufacturer's own datasheet",
    copy: 'Every spec on a product page is transcribed from it, with the PDF linked in full underneath.',
    icon: FileIcon,
  },
  {
    label: 'Bulk orders handled correctly',
    copy: "Lines that are wholesale-only are flagged as such from the first click, so a large order is priced right from the start.",
    icon: TruckIcon,
  },
]

export default function WhyChooseVip() {
  return (
    <Section id="why-choose" className="bg-glare">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="label text-solar-600 flex items-center gap-3 font-medium">
            <span aria-hidden="true" className="bg-solar-500 h-px w-6 shrink-0" />
            Why choose us
          </p>
          <SectionHeading className="font-display-jmc mt-6">Why choose VIP Solar</SectionHeading>
        </div>
        <Lede className="lg:col-span-5 lg:self-end">
          Not the pitch — the parts of buying from us you can actually go and check for yourself.
        </Lede>
      </div>

      <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {POINTS.map((point, i) => (
          <Reveal key={point.label} delay={i * 80} className="group flex items-start gap-4">
            <span className="bg-solar-500/10 text-solar-600 group-hover:bg-solar-500 group-hover:text-navy-950 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-300">
              <point.icon className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-display-jmc text-navy-900 text-base font-bold">{point.label}</h3>
              <p className="text-ink-soft mt-2 text-sm leading-relaxed">{point.copy}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
