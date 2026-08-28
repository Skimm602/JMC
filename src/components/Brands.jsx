import { COMPANY, PARTNER_BRANDS } from '@/utils/company'
import { Button, Eyebrow, Section, SectionHeading, TwoTone } from './ui.jsx'
import { ArrowUpRightIcon } from './icons.jsx'
import BrandMarquee from './BrandMarquee.jsx'
import Reveal from './Reveal.jsx'

/**
 * The dealership, as marks rather than as a sentence.
 *
 * Centred, unlike the two sections either side of it — the marquee runs the
 * full width of the window, so a left-aligned heading over a symmetrical
 * band would sit off its own axis. It is the one centred moment on the page
 * and it earns that by being the one full-bleed one.
 */
export default function Brands() {
  return (
    <Section id="brands">
      <Reveal className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <Eyebrow>Trusted brands</Eyebrow>
        <SectionHeading className="mt-5">
          <TwoTone light="Authorised" dark="to install them." />
        </SectionHeading>
        <p className="text-ink-soft max-w-measure mt-5 leading-relaxed">
          Being a certified dealer is what puts a warranty claim on our desk instead of yours — the same marks
          carried on the manufacturers&apos; own material, on ours because the dealership is ours.
        </p>
      </Reveal>

      <BrandMarquee brands={PARTNER_BRANDS} />

      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Button as="a" href="/#footer" variant="primary" size="lg">
          Get a free quote
          <ArrowUpRightIcon className="h-4 w-4" />
        </Button>
        <a
          href={COMPANY.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink-soft hover:text-navy-900 text-sm font-medium underline underline-offset-4 transition-colors"
        >
          Read every review on Facebook
        </a>
      </div>
    </Section>
  )
}
