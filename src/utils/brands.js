/**
 * Who made it, read off the model number.
 *
 * There is no `brand` column on the products table, and adding one would mean
 * every product sat brandless until somebody ran the migration and filled it
 * in — a filter that lists nothing is worse than no filter. The model numbers
 * already carry the answer unambiguously (a manufacturer's series prefix is
 * the one part of a model number that never collides), so it is read from
 * there instead.
 *
 * This lives in a plain module rather than inside the catalogue component
 * because the shop grid and the storefront shelves both label a card with the
 * brand, and the two must never disagree about who makes an HYX- unit.
 *
 * Longest prefix wins, so a future 'GW-SOMETHING-LB-EU' cannot be caught by a
 * shorter rule that happens to sit earlier in the list.
 */
export const BRAND_RULES = [
  ['GEN2-LB-EU', 'LuxpowerTek'],
  ['T-BAT-SYS', 'SolaX'],
  ['S6-EH1P', 'Solis'],
  ['HYX-', 'HYXiPOWER'],
  ['GW', 'GoodWe'],
  // Schneider names its breaker families rather than numbering them, so the
  // "series prefix" here is the family name itself. All five are Schneider's
  // own registered range names, and none of them collide with an inverter or
  // battery series.
  ['COMPACT', 'Schneider Electric'],
  ['EASYPACT', 'Schneider Electric'],
  ['MASTERPACT', 'Schneider Electric'],
  ['TESYS', 'Schneider Electric'],
  // Square D is Schneider's load-centre brand; the shop sells it as Schneider
  // because that is the name on the invoice and on the enquiry.
  ['QO', 'Schneider Electric'],
  ['HOMELINE', 'Schneider Electric'],
]

/** The brand of one product, or null when the name matches no known series. */
export function brandOf(product) {
  const name = (product?.name ?? '').trim().toUpperCase()

  let best = null
  for (const [prefix, brand] of BRAND_RULES) {
    if (!name.startsWith(prefix.toUpperCase())) continue
    if (!best || prefix.length > best[0].length) best = [prefix, brand]
  }

  return best ? best[1] : null
}

/** Anything the rules do not recognise is still reachable, under one heading. */
export const OTHER_BRAND = 'Other'
