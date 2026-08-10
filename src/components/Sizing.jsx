'use client'

import { useState } from 'react'
import { Eyebrow, Lede, Section, SectionHeading } from './ui.jsx'
import { Field, Select, TextInput } from './form.jsx'
import { InfoIcon } from './icons.jsx'

/**
 * System sizing panel.
 *
 * INTERFACE ONLY — nothing here computes. The inputs hold their own state so
 * the control surface can be reviewed and wired up later, but every derived
 * figure stays blank on purpose: an array size, a yield or a payback period
 * invented client-side would be a number a homeowner might act on, and this
 * page has no tariff data, no irradiance model and no product-selection rules
 * behind it. When the sizing service exists, fill READOUT from its response.
 *
 * The readout is drawn as an instrument display rather than a results card,
 * which is the same panel the H6 carries in InverterArt — the tool and the
 * hardware read as one system.
 */

const REGIONS = [
  'Metro Manila',
  'Central Luzon',
  'Calabarzon',
  'Central Visayas',
  'Western Visayas',
  'Northern Mindanao',
  'Davao Region',
]

const ROOF_TYPES = [
  'Corrugated GI sheet',
  'Standing seam metal',
  'Concrete deck',
  'Clay or concrete tile',
  'Ground mount',
]

const SHADING = ['None to speak of', 'Light, part of the day', 'Heavy for hours']

/** Every field the sizing service will return. Values arrive from the API. */
const READOUT = [
  { key: 'array', label: 'Array size', unit: 'kWp' },
  { key: 'inverter', label: 'Suggested unit', unit: '' },
  { key: 'yield', label: 'Annual yield', unit: 'kWh' },
  { key: 'offset', label: 'Bill offset', unit: '%' },
]

const EMPTY = { bill: '', area: '', region: '', roof: '', shading: '' }

export default function Sizing() {
  const [input, setInput] = useState(EMPTY)
  const set = (key) => (e) => setInput((v) => ({ ...v, [key]: e.target.value }))

  return (
    <Section id="sizing" className="band-sheet">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Eyebrow>Sizing</Eyebrow>
          <SectionHeading className="mt-6">Size the job before you quote it</SectionHeading>
        </div>
        <Lede className="lg:col-span-5 lg:self-end">
          Roof and load details in, a starting specification out. Built for the first site visit, when the
          question is which unit to price rather than which panel to buy.
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

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Monthly electricity bill" hint="Average across the last twelve months.">
              {(p) => (
                <TextInput
                  {...p}
                  inputMode="numeric"
                  value={input.bill}
                  onChange={set('bill')}
                  placeholder="₱ 8,500"
                />
              )}
            </Field>

            <Field label="Usable roof area">
              {(p) => (
                <TextInput
                  {...p}
                  inputMode="numeric"
                  value={input.area}
                  onChange={set('area')}
                  placeholder="64 m²"
                />
              )}
            </Field>

            <Field label="Region" span={2}>
              {(p) => (
                <Select {...p} value={input.region} onChange={set('region')}>
                  <option value="">Select…</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label="Roof construction">
              {(p) => (
                <Select {...p} value={input.roof} onChange={set('roof')}>
                  <option value="">Select…</option>
                  {ROOF_TYPES.map((r) => (
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
                  {SHADING.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        </div>

        {/* ------------------------------ the readout --------------------------
            Drawn as the instrument it will be, held in its unpowered state. */}
        <div className="band-shade border-rule flex flex-col justify-between gap-8 p-7 max-lg:border-t sm:p-9 lg:border-t-0 lg:border-l">
          <div>
            <div className="border-rule-shade flex items-baseline justify-between gap-4 border-b pb-3">
              <p className="label text-glint-soft">Specification</p>
              <p className="label text-glint-soft">Awaiting service</p>
            </div>

            <dl className="mt-2">
              {READOUT.map((r) => (
                <div
                  key={r.key}
                  className="border-rule-shade flex items-baseline justify-between gap-6 border-b py-4"
                >
                  <dt className="label text-glint-soft">{r.label}</dt>
                  <dd className="text-glint-soft flex items-baseline gap-1.5 font-mono text-lg tabular-nums">
                    <span aria-label="No value yet">—</span>
                    {r.unit && <span className="text-[0.6875rem]">{r.unit}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <p className="text-glint-soft flex gap-3 text-xs leading-relaxed">
            <InfoIcon aria-hidden="true" className="text-cool-400 mt-px h-4 w-4 shrink-0" />
            <span>
              The readout is not connected yet. These are the fields JMC&rsquo;s sizing service will return —
              no figure is estimated in the browser.
            </span>
          </p>
        </div>
      </div>
    </Section>
  )
}
