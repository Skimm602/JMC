/**
 * The three types the shop is divided into, and the pages they each have.
 *
 * `key` is the products table's own `category` value; `slug` is the URL
 * segment. They are kept as separate fields because they answer to different
 * owners — the column is a database concern and the URL is a public promise,
 * and renaming one should never quietly require a migration of the other.
 *
 * The header menu, the three per-type pages and their metadata all read this
 * one list, so adding a fourth type is a single entry here rather than four
 * edits that can drift apart.
 */
export const PRODUCT_CATEGORIES = [
  {
    key: 'inverter',
    slug: 'inverters',
    label: 'Inverters',
    // Short enough to sit under the label in the header menu.
    menuBlurb: 'Hybrid inverters, low and high voltage',
    lede: 'Hybrid inverters from HYXiPOWER, LuxpowerTek, Solis and GoodWe — the box between the array, the battery and the switchboard. Every unit here is stocked and specified to hold its rating at Philippine roof temperatures.',
    empty: 'No inverters are listed for sale at the moment. Tell us what the job needs and we will quote it.',
    // Representative unit for the homepage's category cards/slideshow —
    // a real, currently-stocked photo, not a placeholder.
    photo: '/products/h6-8k-ls.png',
  },
  {
    key: 'battery',
    slug: 'batteries',
    label: 'Batteries',
    menuBlurb: 'LiFePO₄ storage — wall, rack and cabinet',
    lede: 'LiFePO₄ storage in wall packs, rack modules and floor cabinets, low and high voltage. Breaker, fuse and cell-temperature sensing are inside the unit, so the install is a mount and a pair of cables rather than a cabinet build.',
    empty: 'No batteries are listed for sale at the moment. Tell us what the job needs and we will quote it.',
    photo: '/products/e50-100-h3.png',
  },
  {
    key: 'accessory',
    slug: 'accessories',
    label: 'Accessories',
    menuBlurb: 'Breakers, meters, mounting and cabling',
    lede: 'Schneider Easy9 miniature circuit breakers, 16 A to 63 A, plus the meters, mounting hardware and cabling an install needs beyond the inverter and the battery.',
    empty:
      'Accessories are not listed online yet. Tell us what the job needs and we will quote it — we stock more than the site lists.',
    // Stays null until somebody decides the home page should carry an
    // accessories card. The shelf itself is populated, so this is a
    // presentation choice rather than a promise of an empty page.
    photo: null,
  },
]

/**
 * A category in the singular, for a badge or a breadcrumb — as against the
 * plural `label` above, which names a whole shelf.
 *
 * It lives here rather than beside the grid that draws it because the product
 * page is a server component: a plain object imported out of a 'use client'
 * module reaches the server as a client reference, and reading a key off that
 * quietly yields undefined rather than failing. That is exactly what put an
 * empty segment in the product breadcrumb — 'Products / / Easy9 MCB 2P 16 A'
 * — and a React key warning underneath it. This module has no 'use client',
 * so both sides get the real object.
 */
export const CATEGORY_LABEL = { inverter: 'Inverter', battery: 'Battery', accessory: 'Accessory' }

/** The page a category lives at. One place, so no link has to spell it out. */
export const categoryHref = (category) => `/products/${category.slug}`

/** Lookup by URL segment, for the pages themselves. */
export const categoryBySlug = (slug) => PRODUCT_CATEGORIES.find((c) => c.slug === slug) ?? null
