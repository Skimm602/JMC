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
  Cordillera: { tariff: 11.6, yield: 1420 },
  Ilocos: { tariff: 12.3, yield: 1520 },
  'Cagayan Valley': { tariff: 12.2, yield: 1440 },
  'Central Luzon': { tariff: 12.1, yield: 1450 },
  Calabarzon: { tariff: 12.4, yield: 1400 },
  Mimaropa: { tariff: 14.2, yield: 1470 },
  Bicol: { tariff: 13.4, yield: 1330 },
  'Western Visayas': { tariff: 13.1, yield: 1440 },
  'Central Visayas': { tariff: 13.6, yield: 1470 },
  'Eastern Visayas': { tariff: 12.8, yield: 1340 },
  'Zamboanga Peninsula': { tariff: 11.8, yield: 1450 },
  'Northern Mindanao': { tariff: 11.4, yield: 1410 },
  'Davao Region': { tariff: 11.7, yield: 1390 },
  Soccsksargen: { tariff: 11.6, yield: 1430 },
  Caraga: { tariff: 12.2, yield: 1340 },
  BARMM: { tariff: 11.9, yield: 1440 },
}

/**
 * Used when the region typed is not one of the above. Roughly the middle of
 * the country on both counts — good enough to return a shape, and the panel
 * says out loud that it fell back to it rather than quietly averaging.
 */
export const NATIONAL = { tariff: 12.5, yield: 1420 }

/**
 * The field is typed, not picked, so what arrives is whatever the installer
 * calls the place. These are the other names for the same regions — the
 * numerals and the acronyms are what most people actually write.
 */
const ALIASES = {
  NCR: 'Metro Manila',
  'National Capital Region': 'Metro Manila',
  Manila: 'Metro Manila',
  CAR: 'Cordillera',
  'Region 1': 'Ilocos',
  'Region I': 'Ilocos',
  'Region 2': 'Cagayan Valley',
  'Region II': 'Cagayan Valley',
  'Region 3': 'Central Luzon',
  'Region III': 'Central Luzon',
  'Region 4A': 'Calabarzon',
  'Region IVA': 'Calabarzon',
  'Region 4B': 'Mimaropa',
  'Region IVB': 'Mimaropa',
  'Region 5': 'Bicol',
  'Region V': 'Bicol',
  'Region 6': 'Western Visayas',
  'Region VI': 'Western Visayas',
  'Region 7': 'Central Visayas',
  'Region VII': 'Central Visayas',
  'Region 8': 'Eastern Visayas',
  'Region VIII': 'Eastern Visayas',
  'Region 9': 'Zamboanga Peninsula',
  'Region IX': 'Zamboanga Peninsula',
  Zamboanga: 'Zamboanga Peninsula',
  'Region 10': 'Northern Mindanao',
  'Region X': 'Northern Mindanao',
  'Region 11': 'Davao Region',
  'Region XI': 'Davao Region',
  Davao: 'Davao Region',
  'Region 12': 'Soccsksargen',
  'Region XII': 'Soccsksargen',
  'Region 13': 'Caraga',
  'Region XIII': 'Caraga',
  Bangsamoro: 'BARMM',
}

/** Case, spacing and punctuation are all noise here. "Region IV-A" = "regioniva". */
const key = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

const LOOKUP = new Map()
for (const name of Object.keys(REGIONS)) LOOKUP.set(key(name), name)
for (const [alias, name] of Object.entries(ALIASES)) LOOKUP.set(key(alias), name)

/**
 * resolveRegion(typed) → a region name, or null if it is not one we hold.
 *
 * Exact first. Failing that, the longest known name contained in what was
 * typed, so "Davao del Sur" still finds Davao and "Region VII (Cebu)" still
 * finds Central Visayas. Keys under five characters are held out of that
 * second pass on purpose: "car" is inside "caraga", and Cordillera is not
 * where Butuan is.
 */
export function resolveRegion(typed) {
  const k = key(typed)
  if (!k) return null
  if (LOOKUP.has(k)) return LOOKUP.get(k)

  let best = null
  for (const [alias, name] of LOOKUP) {
    if (alias.length >= 5 && k.includes(alias) && (!best || alias.length > best.length)) {
      best = { length: alias.length, name }
    }
  }
  return best?.name ?? null
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
 * The hybrid range, as the picker offers it. `maxPv` is the DC the unit will
 * carry, which is what decides how many of them a given array needs.
 *
 * The LS pair run a 48 V bank and cover most single-family jobs. The HS pair
 * are the high-voltage half of the same platform, and their number here is
 * the 200 % DC oversizing the datasheet leads with — 12 kW of PV against 6 kW
 * rated, 16 against 8.
 */
export const UNITS = {
  'HYX-H6K-LS': { rated: 6, maxPv: 7.8 },
  'HYX-H8K-LS': { rated: 8, maxPv: 10.4 },
  'HYX-H6K-HS': { rated: 6, maxPv: 12.0 },
  'HYX-H8K-HS': { rated: 8, maxPv: 16.0 },
}

/**
 * The ladder the model walks when nobody has picked a unit, smallest first:
 * the first unit whose DC input covers the array wins.
 *
 * The H6K-HS is deliberately not on it. Its 12 kW of DC input would let it
 * take an array the H8K-LS is the better answer for — a 6 kW inverter run at
 * 180 % is legal and clips all afternoon, and an unattended suggestion should
 * not be the one that does that. It stays in the picker, because an installer
 * choosing it has a reason the form does not know about.
 */
const AUTO = ['HYX-H6K-LS', 'HYX-H8K-LS', 'HYX-H8K-HS']

/** H-LS parallels to six; past that this stops being a residential job. */
const MAX_PARALLEL = 6

/** How many of `model` the array needs, and how to write that down. */
const bank = (model, array) => {
  const count = Math.max(1, Math.ceil(array / UNITS[model].maxPv))
  return { model, count, label: count === 1 ? model : `${count} × ${model}` }
}

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
 * nor a yield to size against. Roof, area and shading refine the answer and
 * default to the middle of their range when left blank, so the panel starts
 * returning something useful as soon as those two are in.
 *
 * `unit` is the installer's own choice out of UNITS. Left blank, the model
 * suggests one; set, it is honoured and the count is worked out around it.
 */
export function sizeSystem(input) {
  const bill = number(input.bill)

  // Typed but unrecognised is not the same as blank. Blank means the question
  // has not been answered and there is nothing to compute; unrecognised means
  // they told us somewhere we have no figures for, which national averages
  // can stand in for as long as the panel admits that is what happened.
  const typed = String(input.region ?? '').trim()
  const regionName = resolveRegion(typed)
  const region = regionName ? REGIONS[regionName] : typed ? NATIONAL : null

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

  // The unit is the installer's call, not the model's. What the model does is
  // work out how many of whatever they picked the array actually needs, and
  // keep its own answer on hand — offered as an alternative rather than
  // substituted for theirs, because "use this instead" is advice and the
  // person on the roof is allowed to decline it.
  const suggestion = bank(AUTO.find((m) => array <= UNITS[m].maxPv) ?? AUTO[AUTO.length - 1], array)
  const chosen = UNITS[input.unit] ? bank(input.unit, array) : null
  const unit = chosen ?? suggestion

  return {
    ok: true,
    array,
    // What the typed region resolved to, so the panel can show the installer
    // which set of figures it actually used rather than what they typed.
    region: regionName,
    regionFallback: !regionName,
    unit: unit.label,
    chosen: Boolean(chosen),
    // Only worth raising when it would actually change the order.
    alternative: chosen && chosen.label !== suggestion.label ? suggestion.label : null,
    // How hard the chosen bank is being worked. Well under half its DC input
    // means they are paying for headroom the array will never reach.
    dcUse: (array / (unit.count * UNITS[unit.model].maxPv)) * 100,
    generation,
    // Net metering exports the surplus, so the meaningful ceiling is the
    // whole bill rather than the fraction consumed as it is generated.
    offset: Math.min(100, (generation / consumption) * 100),
    // Worth saying out loud: the customer asked for a system that covers the
    // bill and the roof will not hold one.
    roofLimited: fromRoof < fromLoad,
    // Past six units in parallel this is a commercial design, not a form.
    oversized: unit.count > MAX_PARALLEL,
  }
}
