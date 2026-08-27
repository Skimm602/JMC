import { COMPANY, PARTNER_BRANDS } from '@/utils/company'
import { Button, Section, SectionHeading } from './ui.jsx'
import { ArrowUpRightIcon } from './icons.jsx'
import BrandMarquee from './BrandMarquee.jsx'
import Reveal from './Reveal.jsx'

/**
 * The dealership, on the evidence of the marks themselves.
 *
 * Closes the page rather than following the hero, the way the parent
 * company's own site holds its brand strip until after the pitch has been
 * made — a wall of manufacturer logos means nothing to a visitor who has not
 * yet been told why they should be shopping here at all.
 *
 * Centred rather than run inside the page's usual heading-left/lede-right
 * split: that split exists to balance two columns of text, and a marquee has
 * no second column to balance against — pinned to one side of a 12-column
 * grid it read as a heading that had lost its other half.
 */
export default function Brands() {
  return (
    <Section id="brands" className="bg-glare border-rule border-t">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="label text-solar-600 flex items-center justify-center gap-3 font-medium">
          <span aria-hidden="true" className="bg-solar-500 h-px w-6 shrink-0" />
          Trusted brands
        </p>
        <SectionHeading className="font-display-jmc text-navy-900 mx-auto mt-6">
          Brands we are authorised to install
        </SectionHeading>
        <p className="text-ink-soft mx-auto mt-4 max-w-measure leading-relaxed">
          Being a certified dealer is what puts a warranty claim on our desk instead of yours — the same marks
          carried on the manufacturers' own material, on ours because the dealership is ours.
        </p>
      </Reveal>

      <BrandMarquee brands={PARTNER_BRANDS} />

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
        <Button
          as="a"
          href="/#footer"
          className="!bg-solar-500 !text-navy-950 hover:!bg-solar-400 shadow-[0_0_0_0_rgba(245,158,11,0.5)] transition-[background-color,box-shadow] duration-300 hover:!shadow-[0_0_24px_2px_rgba(245,158,11,0.5)]"
        >
          Get a free quote
          <ArrowUpRightIcon className="h-4 w-4" />
        </Button>
        <a
          href={COMPANY.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink-soft hover:text-ink text-sm font-medium underline underline-offset-2 transition-colors"
        >
          Read every review on Facebook
        </a>
      </div>
    </Section>
  )
}
