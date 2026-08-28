import { PRODUCT_CATEGORIES, categoryHref } from '@/utils/product-categories'
import { Eyebrow, Lede, Section, SectionHeading, TwoTone } from './ui.jsx'
import { ArrowUpRightIcon, WrenchIcon } from './icons.jsx'
import Reveal from './Reveal.jsx'

/**
 * Three tiles, cut from the same grid as the hero's.
 *
 * The unit photograph sits in a sky-tinted well rather than on white, so a
 * product shot on a transparent background has a ground to stand on instead
 * of floating in the card. The action is the circular arrow the reference
 * puts on every card — it fills amber on hover, which is the only motion the
 * tile makes besides lifting.
 */
export default function ProductCategories() {
  return (
    <Section id="products">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <Eyebrow>Products</Eyebrow>
          <SectionHeading className="mt-5">
            <TwoTone light="Everything" dark="in the box." />
          </SectionHeading>
        </div>
        <Lede className="lg:col-span-5">
          Inverters, storage and the accessories that go with them — priced and stocked, or quoted where they are
          not.
        </Lede>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {PRODUCT_CATEGORIES.map((category, i) => {
          const photo = category.photo

          return (
            <Reveal
              as="a"
              key={category.key}
              href={categoryHref(category)}
              delay={i * 90}
              className="tile group flex flex-col p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[0_1px_2px_rgba(15,31,64,0.04),0_28px_54px_-28px_rgba(15,31,64,0.55)]"
            >
              <div className="tile-sky flex h-44 items-center justify-center overflow-hidden p-6 shadow-none">
                {photo ? (
                  <img
                    src={photo}
                    alt=""
                    className="h-full w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <WrenchIcon className="text-sky-500 h-12 w-12" />
                )}
              </div>

              <div className="mt-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-navy-900 text-lg font-bold">{category.label}</h3>
                  <p className="text-ink-soft mt-2 text-sm leading-relaxed">{category.menuBlurb}</p>
                </div>
                <span
                  aria-hidden="true"
                  className="border-navy-900/15 text-navy-900 group-hover:bg-solar-500 group-hover:border-solar-500 group-hover:text-navy-950 grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors duration-300"
                >
                  <ArrowUpRightIcon className="h-4 w-4" />
                </span>
              </div>

              <p className="text-ink-soft mt-auto pt-6 text-xs leading-relaxed">
                {photo ? (
                  <>
                    Shop {category.label.toLowerCase()} —{' '}
                    <span className="text-solar-600 font-semibold">in stock, with datasheets.</span>
                  </>
                ) : (
                  <>
                    Not listed online yet — <span className="text-solar-600 font-semibold">ask us on the way through.</span>
                  </>
                )}
              </p>
            </Reveal>
          )
        })}
      </div>
    </Section>
  )
}
