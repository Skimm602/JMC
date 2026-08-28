import { Eyebrow, Lede, Section, SectionHeading, TwoTone } from './ui.jsx'
import { BoxIcon, ChartIcon, FileIcon, LayersIcon, TagIcon, TruckIcon } from './icons.jsx'
import Reveal from './Reveal.jsx'

/**
 * Six tiles rather than six rows of icon-and-text.
 *
 * The old arrangement was a list wearing a grid: three columns of bare text,
 * nothing bounding a point, so the eye read it as one paragraph in six
 * pieces. On a field made of tiles each point gets its own surface, which is
 * what makes it a claim you can take one at a time.
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
    copy: 'Lines that are wholesale-only are flagged as such from the first click, so a large order is priced right from the start.',
    icon: TruckIcon,
  },
]

export default function WhyChooseVip() {
  return (
    <Section id="why-choose">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <Eyebrow>Why choose us</Eyebrow>
          <SectionHeading className="mt-5">
            <TwoTone light="Six things" dark="you can go and check." />
          </SectionHeading>
        </div>
        <Lede className="lg:col-span-5">
          Not the pitch — the parts of buying from us that are verifiable before you spend anything.
        </Lede>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {POINTS.map((point, i) => (
          <Reveal
            key={point.label}
            delay={i * 70}
            className="tile group p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_1px_2px_rgba(15,31,64,0.04),0_28px_54px_-28px_rgba(15,31,64,0.55)]"
          >
            <span className="bg-sky-200 text-navy-900 group-hover:bg-solar-500 group-hover:text-navy-950 flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-300">
              <point.icon className="h-6 w-6" />
            </span>
            <h3 className="text-navy-900 mt-5 text-base font-bold">{point.label}</h3>
            <p className="text-ink-soft mt-2.5 text-sm leading-relaxed">{point.copy}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
