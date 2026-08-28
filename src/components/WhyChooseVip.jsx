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
    label: 'Every brand on one invoice',
    copy: 'HYXiPOWER, Solis, GoodWe, SolaX, Deye, Jinko, Trina and the rest. Order the whole system from one supplier instead of chasing five importers for four boxes.',
    icon: LayersIcon,
  },
  {
    label: 'A price the same day',
    copy: 'Ring, message or order online and the figure comes back the same day, VAT included. No enquiry form and no three-day wait for a quotation.',
    icon: TagIcon,
  },
  {
    label: 'Live stock, not a catalogue PDF',
    copy: 'Every unit shows in stock, low stock or out, updated with each order rather than a figure someone remembers to revise. You know what you are getting before you pay.',
    icon: BoxIcon,
  },
  {
    label: 'Trade account for installers',
    copy: 'Register once for trade pricing, RMA turnaround and stock priority. It scales with your tier, not with the size of the invoice you are placing today.',
    icon: ChartIcon,
  },
  {
    label: "The manufacturer's own datasheet",
    copy: 'Every spec on a product page is transcribed from it, with the PDF linked in full underneath. Check the unit against it before you buy, not after.',
    icon: FileIcon,
  },
  {
    label: 'Bulk and wholesale priced properly',
    copy: 'Lines that are wholesale-only are flagged from the first click, so a large order is priced right from the start rather than renegotiated at the end.',
    icon: TruckIcon,
  },
]

export default function WhyChooseVip() {
  return (
    <Section id="why-choose">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <Eyebrow>Why buy here</Eyebrow>
          <SectionHeading className="mt-5">
            <TwoTone light="Six reasons" dark="to order it from us." />
          </SectionHeading>
        </div>
        <Lede className="lg:col-span-5">
          Not the pitch — the parts of buying from us you can check before you spend a peso.
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
