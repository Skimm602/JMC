import { COMPANY, PARTNER_BRANDS } from '@/utils/company'
import { Button, Eyebrow, Section, SectionHeading, TwoTone } from './ui.jsx'
import { ArrowUpRightIcon, PhoneIcon } from './icons.jsx'
import BrandMarquee from './BrandMarquee.jsx'
import Reveal from './Reveal.jsx'

/**
 * The range, as marks rather than as a sentence.
 *
 * This section used to argue that being a certified dealer puts a warranty
 * claim on our desk — true, and worth saying, but it is an argument about
 * installing. The reason a buyer cares about seventeen marks is that they can
 * fill an entire order here instead of splitting it across five importers,
 * so that is what the heading says now and the warranty follows as support.
 *
 * Centred, unlike the two sections either side of it — the marquee runs the
 * full width of the window, so a left-aligned heading over a symmetrical
 * band would sit off its own axis. It is the one centred moment on the page
 * and it earns that by being the one full-bleed one.
 */
export default function Brands() {
  const brandCount = PARTNER_BRANDS.length

  return (
    <Section id="brands">
      <Reveal className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <Eyebrow>Shop by brand</Eyebrow>
        <SectionHeading className="mt-5">
          <TwoTone light={`${brandCount} brands.`} dark="One invoice." />
        </SectionHeading>
        <p className="text-ink-soft max-w-measure mt-5 leading-relaxed">
          Panels, inverters, storage and balance of system from every mark below — you are not buying a single
          manufacturer&apos;s idea of a system, you are buying the parts that suit the job. We are the authorised
          dealer for all of them, so the warranty claim lands on our desk instead of yours.
        </p>
      </Reveal>

      <BrandMarquee brands={PARTNER_BRANDS} />

      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Button as="a" href="/products" variant="primary" size="lg">
          Shop all brands
          <ArrowUpRightIcon className="h-4 w-4" />
        </Button>
        <Button as="a" href={`tel:${COMPANY.phones[0].replace(/\s/g, '')}`} variant="outline" size="lg">
          <PhoneIcon className="text-solar-600 h-4 w-4 shrink-0" />
          Ask for a brand we have not listed
        </Button>
      </div>
    </Section>
  )
}
