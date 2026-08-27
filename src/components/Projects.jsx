'use client'

import { useState } from 'react'
import { PROJECTS } from '@/utils/company'
import { Section, SectionHeading, cx } from './ui.jsx'
import Reveal from './Reveal.jsx'

const CATEGORIES = ['residential', 'commercial', 'industrial', 'agricultural']

const LABEL = {
  residential: 'Residential',
  commercial: 'Commercial',
  industrial: 'Industrial',
  agricultural: 'Agricultural',
}

/**
 * The installed record, in the format entelechypower.com uses for its own
 * "Entelechy Project" band: a centred heading, a row of category filters,
 * then a justified photo grid where the title only surfaces on hover — the
 * photograph is the argument, not a caption sitting under it.
 *
 * The filter is client-side state over a fixed thirteen-item array rather
 * than a route, because that is everything the parent company's own
 * /projects page lists — there is no fuller catalogue behind it to paginate
 * toward, so a "View All" button here would point at nothing.
 */
export default function Projects() {
  const [active, setActive] = useState('all')
  const shown = active === 'all' ? PROJECTS : PROJECTS.filter((p) => p.category === active)

  return (
    <Section id="projects" className="bg-sheet">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="label text-solar-600 flex items-center justify-center gap-3 font-medium">
          <span aria-hidden="true" className="bg-solar-500 h-px w-6 shrink-0" />
          Our work
        </p>
        <SectionHeading className="font-display-jmc text-navy-900 mt-6">Projects &amp; installations</SectionHeading>
        <p className="text-ink-soft mt-4 max-w-measure leading-relaxed">
          From residential rooftops to large-scale industrial farms — completed solar installations across Eastern
          Visayas.
        </p>
      </Reveal>

      {/* Filters: real counts rather than a fixed set of tabs, so a category
          with nothing shot for it yet cannot appear as an empty press. */}
      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {['all', ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActive(cat)}
            aria-pressed={active === cat}
            className={cx(
              'rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300',
              active === cat
                ? 'bg-solar-500/10 border-solar-500 text-solar-600 shadow-[0_0_0_3px_rgba(245,158,11,0.12)]'
                : 'border-rule-strong bg-glare text-ink-soft hover:border-solar-500/60 hover:text-solar-600',
            )}
          >
            {cat === 'all' ? 'All' : LABEL[cat]}
          </button>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((project, i) => (
          <Reveal
            as="figure"
            key={project.title}
            delay={(i % 8) * 60}
            className="group border-rule hover:border-solar-500/60 rounded-card relative aspect-[4/3] overflow-hidden border transition-[border-color,box-shadow] duration-300 hover:shadow-[0_0_28px_-6px_rgba(245,158,11,0.45)]"
          >
            <img
              src={project.image}
              alt={project.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />

            {/* Dimmed at rest, full brightness on hover — the inverse of the
                usual darken-on-hover overlay, and the same move the parent
                company's own photo grid makes (a scrim that clears rather
                than one that lands). */}
            <div
              aria-hidden="true"
              className="bg-navy-950/15 absolute inset-0 transition-colors duration-500 group-hover:bg-transparent"
            />

            {/* Resting state: just the category, low enough to read against
                any photo. Hover brings the title up from under it — the same
                "title only on hover" move the reference section makes,
                without needing its circular icon overlay to get there. */}
            <div
              aria-hidden="true"
              className="from-navy-950/90 absolute inset-x-0 bottom-0 bg-gradient-to-t via-transparent to-transparent pt-10 pb-3"
            >
              <p className="text-solar-400 px-3 text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
                {LABEL[project.category]}
                {project.size && <span className="text-glint-soft/70 font-normal"> · {project.size}</span>}
              </p>
              <p className="text-glare mt-1 max-h-0 overflow-hidden px-3 text-sm leading-snug font-medium opacity-0 transition-[max-height,opacity] duration-300 group-hover:max-h-16 group-hover:pb-3 group-hover:opacity-100">
                {project.title}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
