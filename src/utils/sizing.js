/**
 * The model behind the sizing panel.
 *
 * What this is: a first-visit starting specification — the array a bill of
 * this size implies, the unit that carries it, and what the roof gives back.
 * What it is not: a quote. Nothing here knows the customer's actual tariff
 * schedule, their real roof pitch and azimuth, or what the distribution
 * utility will approve for net metering. Every figure it returns is an
 * estimate built on the constants below, and the panel says so.
 *
 * It lives here rather than in the component because these are business
 * constants, not markup: the tariffs move every year, and when they do this
 * is the one file that has to change. Pure functions, no React, so the same
 * model can move behind an API later without being rewritten.
 */

/**
 * Per region, the two numbers that drive everything else.
 *
 * `tariff` — indicative all-in residential rate in ₱/kWh: generation,
 * transmission, distribution, system loss and taxes, which is what actually
 * appears on the bill the customer reads off to you. Dividing the bill by
 * this is how monthly consumption is recovered, so it is the single biggest
 * source of error in the whole model — a customer on a lifeline rate or a
 * TOU schedule will not match it. Revisit these annually.
 *
 * `yield` — specific yield in kWh per kWp per year for a well-installed,
 * roughly north-facing to flat array. The Philippines sits between about
 * 1,300 and 1,550 depending on cloud cover and latitude; Visayas and Central
 * Luzon run high, Metro Manila runs low on haze and dense low cloud.
 */
export const REGIONS = {
  'Metro Manila': { tariff: 13.0, yield: 1380 },
  'Central Luzon': { tariff: 12.1, yield: 1450 },
  Calabarzon: { tariff: 12.4, yield: 1400 },
  'Central Visayas': { tariff: 13.6, yield: 1470 },
  'Western Visayas': { tariff: 13.1, yield: 1440 },
  'Northern Mindanao': { tariff: 11.4, yield: 1410 },
  'Davao Region': { tariff: 11.7, yield: 1390 },
}

/**
 * Per roof construction: how much area a kWp actually consumes once the
 * install is real, and what the mounting does to yield.
 *
 * `m2PerKwp` is not panel area. A 580 Wp module is about 2.6 m², so the glass
 * alone is roughly 4.5 m²/kWp — the rest is walkways, ridge and edge setbacks,
 * and on anything tilted, the row spacing needed to keep the front row from
 * shading the one behind it. Ground mount pays the most for that spacing.
 *
 * `derate` is the mounting's effect on output. Panels clamped flat to hot GI
 * sheet run hotter and lose a little; a ground array on a proper tilt frame
 * with air on both faces gets some of it back.
 */
export const ROOF_TYPES = {
  'Corrugated GI sheet': { m2PerKwp: 6.0, derate: 0.97 },
  'Standing seam metal': { m2PerKwp: 6.0, derate: 0.99 },
  'Concrete deck': { m2PerKwp: 8.0, derate: 1.0 },
  'Clay or concrete tile': { m2PerKwp: 6.5, derate: 0.97 },
  'Ground mount': { m2PerKwp: 9.0, derate: 1.02 },
}

/** Shading is judged by eye on site, so the steps are coarse on purpose. */
export const SHADING = {
  'None to speak of': 1.0,
  'Light, part of the day': 0.93,
  'Heavy for hours': 0.8,
}

/**
 * The unit ladder, smallest first. `maxPv` is the DC the unit will carry, so
 * the ladder is read as "the first unit big enough for this array".
 *
 * The LS pair take the array up to 10.4 kWp on a 48 V bank, which is where
 * most single-family jobs land. Past that the HS 8K is the one with the DC
 * headroom — 16 kW of PV input against 8 kW rated, the 200 % oversizing the
 * datasheet leads with — so it takes the large single-unit residential job
 * before anything has to go in parallel.
 */
const UNITS = [
  { model: 'HYX-H6K-LS', maxPv: 7.8 },
  { model: 'HYX-H8K-LS', maxPv: 10.4 },
  { model: 'HYX-H8K-HS', maxPv: 16.0 },
]

/** The largest unit, run in parallel, once one of anything is not enough. */
const PARALLEL = UNITS[UNITS.length - 1]

/** H-LS parallels to six; past that this stops being a residential job. */
const MAX_PARALLEL = 6

/**
 * Fields arrive as whatever was typed — "8,500", "₱8500", "64 m²". Anything
 * that is not a digit or a point is stripped, and a value that does not come
 * out as a positive number is treated as not yet entered rather than as zero.
 */
const number = (raw) => {
  const n = Number(String(raw ?? '').replace(/[^\d.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * sizeSystem(input) → the readout, or what is still missing.
 *
 * Bill and region are the two that cannot be guessed: without a bill there is
 * no load, and without a region there is neither a tariff to convert it with
 * nor a yield to size against. The other three refine the answer and default
 * to the middle of their range when left blank, so the panel starts returning
 * something useful as soon as those two are in.
 */
export function sizeSystem(input) {
  const bill = number(input.bill)
  const region = REGIONS[input.region]

  const missing = []
  if (!bill) missing.push('monthly bill')
  if (!region) missing.push('region')
  if (missing.length) return { ok: false, missing }

  // Blank roof and shading are not zero — they are "assume an ordinary job",
  // which is a metal roof with a bit of afternoon shade.
  const roof = ROOF_TYPES[input.roof] ?? ROOF_TYPES['Corrugated GI sheet']
  const shading = SHADING[input.shading] ?? SHADING['Light, part of the day']

  const consumption = (bill / region.tariff) * 12
  const perKwp = region.yield * roof.derate * shading

  // Two independent ceilings, and the roof usually wins on a Philippine
  // house: the array that would cover the year's consumption, and the array
  // that physically fits. Whichever is smaller is the one you can build.
  const fromLoad = consumption / perKwp
  const area = number(input.area)
  const fromRoof = area ? area / roof.m2PerKwp : Infinity
  const array = Math.min(fromLoad, fromRoof)

  // Below about a kilowatt-peak there is no job here — a bill that small is
  // cheaper to leave alone than to put an inverter against.
  if (array < 1) return { ok: false, missing: [], tooSmall: true }

  const generation = array * perKwp

  const single = UNITS.find((u) => array <= u.maxPv)
  const count = single ? 1 : Math.ceil(array / PARALLEL.maxPv)
  const unit = single ?? PARALLEL

  return {
    ok: true,
    array,
    unit: count === 1 ? unit.model : `${count} × ${unit.model}`,
    generation,
    // Net metering exports the surplus, so the meaningful ceiling is the
    // whole bill rather than the fraction consumed as it is generated.
    offset: Math.min(100, (generation / consumption) * 100),
    // Worth saying out loud: the customer asked for a system that covers the
    // bill and the roof will not hold one.
    roofLimited: fromRoof < fromLoad,
    // Past six units in parallel this is a commercial design, not a form.
    oversized: count > MAX_PARALLEL,
  }
}
