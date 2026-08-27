import { ADDRESS_LINE, COMPANY, CREDENTIALS, STORY } from '@/utils/company'
import { Button, Section, SectionHeading } from './ui.jsx'
import { ArrowUpRightIcon, CheckIcon, PhoneIcon } from './icons.jsx'
import Reveal from './Reveal.jsx'

/**
 * Who the company is, on the evidence.
 *
 * Everything here used to be marked PLACEHOLDER in this file — an invented
 * founding year, "four product families", "more than forty countries", "two
 * point four gigawatts shipped" — and all of it was live to customers. It is
 * replaced by the real record in `@/utils/company`, which is the only place a
 * company fact is allowed to live.
 *
 * The band closes on the address and the phone rather than on the story,
 * because this page exists to sell: a visitor who reads this far has decided
 * they might trust us and the next thing they need is a way to start.
 */
export default function About() {
  const phone = COMPANY.phones[0]

  return (
    <Section id="about" className="band-shade">
      <div id="about-heading" className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SectionHeading className="font-display-jmc text-glint">Built by the people who climb the roof</SectionHeading>
        </div>
        <p className="text-glint-soft max-w-measure text-base leading-relaxed sm:text-[1.0625rem] lg:col-span-5 lg:self-end">
          {COMPANY.formerName} in Ormoc City — renewable energy across Leyte, Southern Leyte and Cebu.
        </p>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-10">
        <Reveal as="figure" delay={120} className="group lg:col-start-9 lg:col-span-4 lg:row-start-1">
          <div className="border-rule-shade rounded-panel overflow-hidden border">
            <img
              src="/about-sunset.jpg"
              alt="Sunrise low on the horizon at the end of a row of solar panels, seen down the channel between two rows."
              loading="lazy"
              className="aspect-[418/733] w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </Reveal>

        <Reveal as="div" className="max-w-measure grid gap-6 lg:col-start-1 lg:col-span-7 lg:row-start-1">
          {STORY.map((paragraph, i) => (
            <p key={i} className="text-glint-soft leading-relaxed">
              {paragraph}
            </p>
          ))}

          {/* The three things that decide whether a roof job is legal and
              insurable — a different question from whether the equipment is
              any good, and the one a homeowner does not know to ask. */}
          <ul className="mt-2 grid gap-5">
            {CREDENTIALS.map((c) => (
              <li key={c.title} className="flex gap-3.5">
                <CheckIcon className="text-solar-400 mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-glint text-sm font-medium">{c.title}</p>
                  <p className="text-glint-soft mt-1 text-sm leading-relaxed">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="border-rule-shade mt-4 border-t pt-8">
            <p className="text-glint-soft text-sm leading-relaxed">
              {ADDRESS_LINE}
              <span className="text-hush"> · </span>
              {COMPANY.hours}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Button
                as="a"
                href="/#footer"
                className="!bg-solar-500 !text-navy-950 hover:!bg-solar-400 shadow-[0_0_0_0_rgba(245,158,11,0.5)] transition-[background-color,box-shadow] duration-300 hover:!shadow-[0_0_24px_2px_rgba(245,158,11,0.5)]"
              >
                Get a free quote
                <ArrowUpRightIcon className="h-4 w-4" />
              </Button>
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="text-glint hover:text-solar-400 inline-flex items-center gap-2.5 font-mono text-sm font-medium transition-colors"
              >
                <PhoneIcon className="h-4 w-4 shrink-0" />
                {phone}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
