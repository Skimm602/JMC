import { PRODUCT_CATEGORIES, categoryHref } from '@/utils/product-categories'
import { Eyebrow, Lede, Section, SectionHeading } from './ui.jsx'
import { ArrowRightIcon, WrenchIcon } from './icons.jsx'

/**
 * The shop, one click deep, before the range gets into datasheets. Three
 * cards rather than a paragraph — a visitor deciding what they even need
 * should not have to read the engineering section to find out we sell
 * batteries.
 *
 * Accessories has no photo (`photo: null` in `product-categories.js`)
 * because nothing is stocked under it yet. An icon and a shorter, honest
 * note stand in rather than a photo borrowed from another category.
 */
export default function ProductCategories() {
  return (
    <Section id="products" className="band-sheet">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Eyebrow>Products</Eyebrow>
          <SectionHeading className="mt-6">Products by category</SectionHeading>
        </div>
        <Lede className="lg:col-span-5 lg:self-end">
          Inverters, storage and the accessories that go with them — priced and stocked, or quoted where they are not.
        </Lede>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {PRODUCT_CATEGORIES.map((category) => {
          const photo = category.photo

          return (
            <a
              key={category.key}
              href={categoryHref(category)}
              className="group border-rule bg-glare hover:border-ink-soft rounded-panel flex flex-col border p-6 transition-colors duration-200"
            >
              <div className="bg-sheet rounded-card flex h-40 items-center justify-center p-5">
                {photo ? (
                  <img src={photo} alt="" className="h-full w-auto object-contain" />
                ) : (
                  <WrenchIcon className="text-hush h-10 w-10" />
                )}
              </div>

              <h3 className="text-ink group-hover:text-cool-600 mt-6 font-mono text-[0.9375rem] font-medium transition-colors">
                {category.label}
              </h3>
              <p className="text-ink-soft mt-2 text-sm leading-relaxed">{category.menuBlurb}</p>

              <div className="mt-auto pt-6">
                {photo ? (
                  <span className="text-ink-soft group-hover:text-ink flex items-center gap-2 text-sm font-medium transition-colors">
                    <span className="border-b border-current/40 pb-px transition-colors group-hover:border-current">
                      Shop {category.label.toLowerCase()}
                    </span>
                    <ArrowRightIcon
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </span>
                ) : (
                  <p className="text-ink-soft text-xs leading-relaxed">
                    Not listed online yet — <span className="text-cool-600 font-medium">ask us on the way through.</span>
                  </p>
                )}
              </div>
            </a>
          )
        })}
      </div>
    </Section>
  )
}
