import { Button, Eyebrow, Lede, Section, SectionHeading } from './ui.jsx'

/**
 * ============================================================================
 *  PLACEHOLDER COPY — everything in the two blocks below is example text.
 *  Replace the strings in STORY and MILESTONES with the real thing; the
 *  layout does not care how long they are or how many milestones there are.
 *  The heading and lede further down are marked with the same note.
 * ============================================================================
 *
 * Sits on a dark band because it lands between the hero and the range, both
 * of which are light — without the contrast the three would read as one very
 * long band. It is also the only place on the page that speaks as the company
 * rather than about the hardware, so a change of surface suits it.
 */

/** Example — replace with the real company story. */
const STORY = [
  'VIP Solar started in a workshop in Ormoc, repairing inverters that had failed their first summer. The pattern was hard to miss: the hardware was not built for the heat it was sold into, and the people carrying the cost were the installers going back to fix it.',
  'So we built our own. Every unit is specified for the conditions our own crews work in — sustained heat, salt air, unstable grids — and tested at those limits rather than at a laboratory 25 °C that nobody installs into.',
  'Today we manufacture across four product families and support installers in more than forty countries. The workshop is still here, and warranty returns still land on the same bench they always did.',
]

/** Example — replace with the real dates. Add or remove rows freely. */
const MILESTONES = [
  { year: '2014', event: 'Founded as a repair shop in Ormoc' },
  { year: '2017', event: 'First S4 grid-tie inverter shipped' },
  { year: '2020', event: 'H6 hybrid platform and V-Stack storage' },
  { year: '2023', event: 'Installer program opens to the region' },
  { year: '2026', event: 'Two point four gigawatts shipped' },
]

export default function About() {
  return (
    <Section id="about" className="band-shade">
      <div id="about-heading" className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Eyebrow tone="shade">About us</Eyebrow>
          {/* Example — replace with the real headline. */}
          <SectionHeading className="text-glint mt-6">Built by people who service what they sell</SectionHeading>
        </div>
        {/* Example — replace with the real standfirst. */}
        <Lede tone="shade" className="lg:col-span-5 lg:self-end">
          A short paragraph on who the company is and why it exists. One or two sentences is enough — the detail belongs
          below.
        </Lede>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-10">
        {/* The photo is 418 px wide and portrait, which is the whole reason it
            sits in a four-column well rather than across the band: four
            columns of this rail is about 410 px, so it renders at roughly its
            own size instead of being stretched to three times it. A wide strip
            would be the flattering shape for the picture and the unflattering
            one for its pixels, and softness is the first thing anyone notices.

            Both columns name their row as well as their column. Auto-placement
            only moves forward, so a figure that starts at column nine pushes
            anything declared after it onto a second row — which is how the
            story ended up under the picture instead of beside it. Pinned to
            the last four columns rather than packed against the
            story, because the story stops at a reading measure well short of
            its own seven: left to pack, the picture would sit in the middle
            with the slack outside it, which reads as a column that failed to
            reach the edge rather than as space.

            Its height falls out of its own aspect ratio, which lands within a
            few pixels of the story and milestones beside it — the column pair
            reads as one block without either side being padded to match. */}
        <figure className="lg:col-start-9 lg:col-span-4 lg:row-start-1">
          <div className="border-rule-shade rounded-panel overflow-hidden border">
            <img
              src="/about-sunset.jpg"
              alt="Sunrise low on the horizon at the end of a row of solar panels, seen down the channel between two rows."
              loading="lazy"
              className="aspect-[418/733] w-full object-cover"
            />
          </div>
        </figure>

        {/* the story, at reading measure rather than full column width */}
        <div className="max-w-measure grid gap-6 lg:col-start-1 lg:col-span-7 lg:row-start-1">
          {STORY.map((paragraph, i) => (
            <p key={i} className="text-glint-soft leading-relaxed">
              {paragraph}
            </p>
          ))}

          <div className="mt-4 flex flex-wrap gap-3">
            <Button as="a" href="/faqs" variant="outlineShade">
              Read more
            </Button>
            <Button as="a" href="/#footer" variant="ghostShade">
              Contact us
            </Button>
          </div>

          {/* Milestones as a dated list rather than a drawn timeline: the
              dates are the information, and a connecting line would only
              decorate them. Definition list because that is what year → event
              is. Under the story rather than beside it now, because the
              column beside it belongs to the photograph. */}
          <div className="mt-8">
            <h3 className="label text-glint-soft border-rule-shade border-b pb-4">Milestones</h3>
            <dl className="mt-1">
              {MILESTONES.map((m) => (
                <div key={m.year} className="border-rule-shade flex items-baseline gap-6 border-b py-4">
                  <dt className="text-cool-400 shrink-0 font-mono text-sm tabular-nums">{m.year}</dt>
                  <dd className="text-glint text-sm leading-relaxed">{m.event}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </Section>
  )
}
