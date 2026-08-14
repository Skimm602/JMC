'use client'

import { useMemo, useState } from 'react'
import { Eyebrow, Lede, Section, SectionHeading } from './ui.jsx'
import { Field, Select, TextInput } from './form.jsx'
import { InfoIcon } from './icons.jsx'
import { REGIONS, ROOF_TYPES, SHADING, UNITS, sizeSystem } from '@/utils/sizing'

/**
 * System sizing panel.
 *
 * The readout is live: bill and region are enough to return a specification,
 * and the remaining three fields refine it. The model itself is in
 * utils/sizing.js — the tariffs and yields it runs on are business constants
 * that move every year, and they should not be buried in markup.
 *
 * What is deliberately not claimed: this is a starting specification for the
 * first site visit, not a quote. The panel says as much under the figures,
 * because an array size and a bill offset are numbers a homeowner will act
 * on, and the regional tariff behind them is an average rather than their
 * actual schedule.
 *
 * The readout is drawn as an instrument display rather than a results card,
 * which is the same panel the H6 carries in InverterArt — the tool and the
 * hardware read as one system.
 */

/** Every field the model returns, in the order the readout shows them. */
const READOUT = [
  { key: 'array', label: 'Array size', unit: 'kWp' },
  { key: 'inverter', label: 'Unit', unit: '' },
  { key: 'yield', label: 'Annual yield', unit: 'kWh' },
  { key: 'offset', label: 'Bill offset', unit: '%' },
]

const EMPTY = { bill: '', area: '', region: '', roof: '', shading: '', unit: '' }

/**
 * An estimate that reads "10,734 kWh" claims a precision the model does not
 * have. Yield is rounded to the nearest hundred and the offset to a whole
 * percent so the figures look like what they are.
 */
const grouped = (n) => Math.round(n / 100) * 100
const format = (result) => ({
  array: result.array.toFixed(1),
  inverter: result.unit,
  yield: grouped(result.generation).toLocaleString('en-PH'),
  offset: String(Math.round(result.offset)),
})

export default function Sizing() {
  const [input, setInput] = useState(EMPTY)
  const set = (key) => (e) => setInput((v) => ({ ...v, [key]: e.target.value }))

  const result = useMemo(() => sizeSystem(input), [input])
  const values = result.ok ? format(result) : null

  const status = result.ok ? 'Estimate' : result.tooSmall ? 'Below minimum' : 'Awaiting input'

  return (
    <Section id="sizing" className="band-sheet">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Eyebrow>Sizing</Eyebrow>
          <SectionHeading className="mt-6">Size the job before you quote it</SectionHeading>
        </div>
        <Lede className="lg:col-span-5 lg:self-end">
          Roof and load details in, a starting specification out. Built for the first site visit, when the question is
          which unit to price rather than which panel to buy.
        </Lede>
      </div>

      {/* Corner ticks mark the page's instrument surfaces — the hero figure,
          the registration form, and now this. Not a general card treatment. */}
      <div className="border-rule corner-ticks mt-16 grid border lg:grid-cols-[1fr_minmax(0,26rem)]">
        {/* ------------------------------- inputs ------------------------------
            White panel raised off the sky band — the same figure/ground the
            registration form uses, so the two input surfaces on the page are
            read the same way. */}
        <div className="band-glare p-7 sm:p-9">
          <p className="label text-ink-soft">Site conditions</p>

          {/* Bill and region carry the asterisk because they are the two the
              model cannot assume: one is the load, the other is both the
              tariff that recovers it and the yield it is sized against. The
              rest genuinely are optional — left blank they fall back to an
              ordinary metal roof with a bit of afternoon shade. */}
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Monthly electricity bill" required hint="Average across the last twelve months.">
              {(p) => (
                <TextInput {...p} inputMode="numeric" value={input.bill} onChange={set('bill')} placeholder="₱ 8,500" />
              )}
            </Field>

            <Field label="Usable roof area" hint="Leave blank to size on the bill alone.">
              {(p) => (
                <TextInput {...p} inputMode="numeric" value={input.area} onChange={set('area')} placeholder="64 m²" />
              )}
            </Field>

            {/* Typed rather than picked. A closed dropdown of seventeen
                regions is a list to hunt through on a phone in somebody's
                driveway, and it has no answer at all for the installer who
                works in terms of the province. The datalist keeps the
                suggestions; the model does the matching, including the
                numerals and acronyms people actually write. */}
            <Field label="Region" required span={2} hint="Type it, or choose from the suggestions.">
              {(p) => (
                <>
                  <TextInput
                    {...p}
                    list="sizing-regions"
                    autoComplete="off"
                    value={input.region}
                    onChange={set('region')}
                    placeholder="Central Luzon"
                  />
                  <datalist id="sizing-regions">
                    {Object.keys(REGIONS).map((r) => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                </>
              )}
            </Field>

            <Field label="Roof construction">
              {(p) => (
                <Select {...p} value={input.roof} onChange={set('roof')}>
                  <option value="">Select…</option>
                  {Object.keys(ROOF_TYPES).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label="Shading">
              {(p) => (
                <Select {...p} value={input.shading} onChange={set('shading')}>
                  <option value="">Select…</option>
                  {Object.keys(SHADING).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>

          {/* Held apart from the site conditions because it is a different
              kind of question with a different owner: the roof is measured,
              the unit is decided. Each option carries its rated output and
              its DC ceiling, so the choice can be made here rather than by
              opening four datasheets first. */}
          <div className="border-rule mt-8 border-t pt-8">
            <p className="label text-ink-soft">Unit</p>

            <div className="mt-6">
              <Field
                label="Preferred unit"
                hint="Left on suggest, the smallest unit whose DC input carries the array is used."
              >
                {(p) => (
                  <Select {...p} value={input.unit} onChange={set('unit')}>
                    <option value="">Suggest one for me</option>
                    {Object.entries(UNITS).map(([model, u]) => (
                      <option key={model} value={model}>
                        {model} — {u.rated} kW, up to {u.maxPv} kWp
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
          </div>
        </div>

        {/* ------------------------------ the readout -------------------------- */}
        <div className="band-shade border-rule flex flex-col justify-between gap-8 p-7 max-lg:border-t sm:p-9 lg:border-t-0 lg:border-l">
          <div>
            <div className="border-rule-shade flex items-baseline justify-between gap-4 border-b pb-3">
              <p className="label text-glint-soft">Specification</p>
              {/* The state of the instrument, not decoration: it is the only
                  thing telling you whether the dashes mean "no answer" or
                  "not enough asked". aria-live so the change is announced
                  rather than only seen. */}
              <p className="label text-glint-soft" aria-live="polite">
                {status}
              </p>
            </div>

            <dl className="mt-2">
              {READOUT.map((r) => {
                // The unit row is the only one whose name depends on where its
                // value came from. Calling their own choice a suggestion would
                // read as though the form had overruled them.
                const label = r.key === 'inverter' && !result.chosen ? 'Suggested unit' : r.label

                return (
                  <div key={r.key} className="border-rule-shade flex items-baseline justify-between gap-6 border-b py-4">
                    <dt className="label text-glint-soft">{label}</dt>
                    <dd
                      className={`flex items-baseline gap-1.5 font-mono text-lg tabular-nums ${
                        values ? 'text-glint' : 'text-glint-soft'
                      }`}
                    >
                      {values ? <span>{values[r.key]}</span> : <span aria-label="No value yet">—</span>}
                      {r.unit && <span className="text-[0.6875rem]">{r.unit}</span>}
                    </dd>
                  </div>
                )
              })}
            </dl>
          </div>

          <div className="text-glint-soft flex gap-3 text-xs leading-relaxed">
            <InfoIcon aria-hidden="true" className="text-cool-400 mt-px h-4 w-4 shrink-0" />
            <div className="space-y-2">
              {!result.ok && result.missing?.length > 0 && (
                <p>
                  Enter the {result.missing.join(' and the ')} to see a starting specification. The other three refine
                  it.
                </p>
              )}

              {!result.ok && result.tooSmall && (
                <p>
                  That bill works out under a kilowatt-peak of array. There is no system here worth quoting — check the
                  figure is a month rather than a week.
                </p>
              )}

              {result.ok && (
                <>
                  {/* Which figures the typed region actually resolved to. The
                      fallback is called out loudly because national averages
                      are the weakest input the model can be given; a plain
                      resolution is just confirmation and stays quiet. */}
                  {result.regionFallback ? (
                    <p className="text-glint">
                      No tariff or yield held for &ldquo;{input.region.trim()}&rdquo; — sized on national averages.
                      Choose one of the suggested regions for a closer estimate.
                    </p>
                  ) : (
                    result.region.toLowerCase() !== input.region.trim().toLowerCase() && (
                      <p>Sized on {result.region} figures.</p>
                    )
                  )}

                  {/* Said first, because it is the one that changes what the
                      installer does next: the answer is smaller than the bill
                      asked for, and the reason is the roof. */}
                  {result.roofLimited && (
                    <p className="text-glint">
                      The roof is the constraint here, not the bill — {input.area} m² is what caps the array. A bigger
                      roof would carry more.
                    </p>
                  )}

                  {result.oversized && (
                    <p className="text-glint">
                      Past six units in parallel this is a commercial design rather than a form. Talk to us before
                      quoting it.
                    </p>
                  )}

                  {/* Their choice stands; this is the second opinion beside
                      it. The DC loading is the number that says why — a bank
                      running well under half its input is headroom being paid
                      for and never reached. */}
                  {result.alternative && (
                    <p className="text-glint">
                      Left to itself the model would specify {result.alternative}. Your pick runs at{' '}
                      {Math.round(result.dcUse)} % of its DC input.
                    </p>
                  )}

                  <p>
                    A starting specification for the first site visit, not a quote. Built on an indicative regional
                    tariff and yield — confirm against the customer&rsquo;s own bill, roof pitch and utility before
                    pricing.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
