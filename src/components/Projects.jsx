'use client'

import { useState } from 'react'
import { PROJECTS } from '@/utils/company'
import { Eyebrow, Lede, Section, SectionHeading, TwoTone, cx } from './ui.jsx'
import Reveal from './Reveal.jsx'

const CATEGORIES = ['residential', 'commercial', 'industrial', 'agricultural']

const LABEL = {
  residential: 'Residential',
  commercial: 'Commercial',
  industrial: 'Industrial',
  agricultural: 'Agricultural',
}

/**
 * The work, as a bento rather than as a uniform grid.
 *
 * The first job in whatever filter is showing takes a tile four times the
 * size of the others. A grid of thirteen identical thumbnails asks the eye to
 * treat every one as equally important, which is how a portfolio ends up
 * being scrolled past; giving the lead job a size means there is a way in.
 *
 * Every entry is a completed installation published on the company's own
 * projects page. `size` appears only where that page states one.
 */
export default function Projects() {
  const [active, setActive] = useState('all')
  const shown = active === 'all' ? PROJECTS : PROJECTS.filter((p) => p.category === active)

  return (
    <Section id="projects">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <Eyebrow>Our work</Eyebrow>
          <SectionHeading className="mt-5">
            <TwoTone light="Thirteen roofs" dark="already energised." />
          </SectionHeading>
        </div>
        <Lede className="lg:col-span-5">
          From residential rooftops to megawatt-scale industrial plant — completed installations across Eastern
          Visayas.
        </Lede>
      </div>

      {/* Filters as capsules on the field, matching the header's own pill
          vocabulary. The pressed one fills navy rather than tinting, so which
          filter is on is legible at a glance and not just by hue. */}
      <div className="mt-8 flex flex-wrap gap-2.5">
        {['all', ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActive(cat)}
            aria-pressed={active === cat}
            className={cx(
              'h-10 rounded-full border px-5 text-sm font-medium transition-colors duration-200',
              active === cat
                ? 'bg-navy-900 border-navy-900 text-glare'
                : 'border-navy-900/15 text-ink-soft hover:border-navy-900/50 hover:text-navy-900 bg-white/60',
            )}
          >
            {cat === 'all' ? 'All work' : LABEL[cat]}
          </button>
        ))}
      </div>

      <div className="mt-8 grid auto-rows-[10rem] grid-cols-2 gap-4 sm:auto-rows-[12rem] lg:auto-rows-[13rem] lg:grid-cols-4">
        {shown.map((project, i) => (
          <Reveal
            as="figure"
            key={project.title}
            delay={(i % 8) * 60}
            className={cx(
              'tile-photo group h-full',
              // The lead job, at four tiles' worth. Only on the wide grid —
              // at two columns it would be the whole row twice over.
              i === 0 && 'col-span-2 row-span-2',
            )}
          >
            <img
              src={project.image}
              alt={project.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Dimmed at rest and clearing on hover — the inverse of the usual
                darken-on-hover, so the photograph is the thing that rewards
                attention rather than the overlay. */}
            <div
              aria-hidden="true"
              className="bg-navy-950/10 absolute inset-0 transition-colors duration-500 group-hover:bg-transparent"
            />

            <div
              aria-hidden="true"
              className="from-navy-950/90 absolute inset-x-0 bottom-0 bg-gradient-to-t via-transparent to-transparent px-4 pt-12 pb-4"
            >
              <p className="text-solar-400 text-[0.6875rem] font-semibold tracking-[0.1em] uppercase">
                {LABEL[project.category]}
                {project.size && <span className="text-glint-soft/70 font-normal"> · {project.size}</span>}
              </p>
              <p
                className={cx(
                  'text-glare mt-1 leading-snug font-semibold',
                  // The lead tile has the room to say what it is without
                  // being asked; the small ones bring the title up on hover.
                  i === 0
                    ? 'text-base sm:text-lg'
                    : 'max-h-0 overflow-hidden text-sm opacity-0 transition-[max-height,opacity] duration-300 group-hover:max-h-16 group-hover:opacity-100',
                )}
              >
                {project.title}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
