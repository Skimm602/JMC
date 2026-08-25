import { Eyebrow, Lede, Section, SectionHeading } from './ui.jsx'

/**
 * What it is like to actually buy and stock from VIP Solar, rather than the
 * engineering case for the hardware itself. Every point here is a real,
 * checkable feature of the site or the program already built elsewhere
 * (`Catalogue.jsx`'s live stock and published pricing, `InstallerProgram.jsx`'s
 * tiers, the real brands listed in `Products.jsx`) — nothing here is a number
 * invented for this section.
 */
const POINTS = [
  {
    label: 'Multi-brand range',
    copy: 'Our own HYXiPOWER platform, plus LuxpowerTek, Solis, GoodWe and SolaX — one supplier instead of five.',
  },
  {
    label: 'Three installer tiers',
    copy: 'Registered, Certified and Master. Trade pricing, RMA turnaround and stock priority scale with the tier, not the invoice.',
  },
  {
    label: 'Published pricing',
    copy: 'List and trade prices shown on every product page — no quote request needed just to find out what something costs.',
  },
  {
    label: 'Live stock, not a catalogue PDF',
    copy: 'Every unit shows in stock, low stock or out, updated with every order rather than a figure someone remembers to revise.',
  },
  {
    label: "The manufacturer's own datasheet",
    copy: 'Every spec on a product page is transcribed from it, with the PDF linked in full underneath.',
  },
  {
    label: 'Bulk orders handled correctly',
    copy: "Lines that are wholesale-only are flagged as such from the first click, so a large order is priced right from the start.",
  },
]

export default function WhyChooseVip() {
  return (
    <Section id="why-choose" className="band-glare">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Eyebrow>Why choose us</Eyebrow>
          <SectionHeading className="mt-6">Why choose VIP Solar</SectionHeading>
        </div>
        <Lede className="lg:col-span-5 lg:self-end">
          Not the pitch — the parts of buying from us you can actually go and check for yourself.
        </Lede>
      </div>

      <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {POINTS.map((point) => (
          <div key={point.label} className="border-rule-strong border-t pt-5">
            <h3 className="text-ink font-mono text-[0.9375rem] font-medium">{point.label}</h3>
            <p className="text-ink-soft mt-2.5 text-sm leading-relaxed">{point.copy}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}
