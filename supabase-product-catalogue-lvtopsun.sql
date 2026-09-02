-- ===========================================================================
--  Run this ONCE in the Supabase SQL editor.
--  Dashboard -> SQL Editor -> New query -> paste ALL of this -> Run.
--
--  LVTOPSUN low-voltage residential storage, taken from the range page the
--  shop was asked to work from:
--
--    lvtopsun.com/low-voltage-ess/
--
--  FOUR BATTERIES, which is every low-voltage residential battery that page
--  carries. The same page also lists three hybrid inverters (4 kW, 6 kW and
--  12 kW LVTS-HYD) and a 125 kW / 261 kWh liquid-cooled C&I cabinet. Those
--  are not batteries and are not here; the brief was the batteries.
--
--  WHERE THE CONTENT COMES FROM
--    - Names: the model number, as LVTOPSUN prints it, because that is the
--      unit a customer asks for and it is what the brand filter reads. See
--      src/utils/brands.js, where LVTS- now resolves to LVTOPSUN.
--    - Photographs: LVTOPSUN's own product photography, pulled at full
--      resolution from the four product pages, then converted to WebP into
--      /public/products. Downloaded rather than hotlinked, same as every
--      other product in this catalogue.
--    - Specifications: transcribed from the performance table on each
--      product page and nothing else. Where that table is silent — cycle
--      life, IP rating, parallel capability, certification — this file is
--      silent too. Nothing here is guessed or carried over from a
--      neighbouring model.
--
--  A NOTE ON THE SUPPLIED DRIVE FOLDER. The Google Drive pack holds
--  datasheets, manuals, certification and catalogue PDFs, but no product
--  photography at all — every one of its twenty-four files is a PDF. The
--  photographs here therefore come from the product pages, which is where
--  the usable renders live. The Drive manuals are not linked from the
--  storefront: they sit in a personal Drive whose sharing can change under
--  us, and a dead manual link on a product page is worse than none. Host
--  them under /public and set manual_url if you want them on the site.
--
--  NO PRICES ARE SET HERE. Every row lands with retail_price 0, which the
--  storefront reads as "not priced yet": browsable and specified, not
--  orderable. Put the real pesos in from the back office —
--
--      /admin/maintenance -> the product -> Retail price / Installer price
--
--  and the line starts selling the moment it has a figure.
--
--  SAFE TO RE-RUN. A second run refreshes description/specs/images/links and
--  leaves retail_price, installer_price and stock_quantity exactly as the
--  back office set them.
-- ===========================================================================

begin;

create unique index if not exists products_name_key on public.products (name);


-- ---------------------------------------------------------------------------
-- 1. THE 51.2 V FLOOR-STANDING WALLS
--
--    One cabinet, one set of terminations, enough energy to carry a house
--    overnight rather than bridge it through a brownout.
-- ---------------------------------------------------------------------------

insert into public.products
  (name, description, retail_price, installer_price, stock_quantity, is_active,
   image_url, datasheet_url, manual_url, specifications)
values

(
  'LVTS-512300-G3',
  'Floor-standing 15.36 kWh LiFePO4 wall for a house that wants the whole night off the grid, not a bridge through a brownout. 300 Ah at 51.2 V, 150 A in and 200 A back out, so a 10 kW hybrid inverter runs at full output instead of throttling to what the battery will give. Reads out on an LCD as well as the SOC lamps, and talks RS232, RS485 or CAN to whichever inverter it is paired with.',
  0, null, null, true,
  '/products/lvtopsun-lvts-512300-g3.webp',
  'https://www.lvtopsun.com/lvts-512300-g3-residential-photovoltaic-energy-storage-lithium-ion-battery-product/',
  null,
  array[
    '# Performance',
    'Battery type: LiFePO4',
    'Nominal voltage: 51.2 V DC',
    'Nominal capacity: 300 Ah',
    'Battery energy: 15.36 kWh',
    'Charge current: 150 A',
    'Charge power: 7680 W',
    'Discharge current: 200 A',
    'Discharge power: 10240 W',
    'Short circuit current: 540 A',
    '# Mechanical',
    'Dimensions (W x D x H): 866 x 450 x 230 mm',
    'Weight: 117 kg',
    'Installation: Floor stand',
    '# Interface',
    'Display: SOC status indicator, LED indicator, LCD display',
    'Communication: RS232, RS485, CAN',
    '# Environment',
    'Working temperature: -20 to +60 C'
  ]
),

(
  'LVTS-512314-G3',
  'The 314 Ah cell in the same 866 mm cabinet as the 300 — 16.08 kWh for the same footprint, the same floor space and the same single set of terminations to inspect. Charges to 56.16 V at 150 A and gives 200 A back, works down to 45.6 V before it stops, and speaks CAN or RS485 to the inverter. The one to quote when the extra kilowatt-hour costs nothing in room.',
  0, null, null, true,
  '/products/lvtopsun-lvts-512314-g3.webp',
  'https://www.lvtopsun.com/lvts-512314-g3-residential-photovoltaic-energy-storage-lithium-ion-battery-product/',
  null,
  array[
    '# Performance',
    'Battery type: LiFePO4',
    'Nominal voltage: 51.2 V DC',
    'Nominal capacity: 314 Ah',
    'Nominal energy: 16076.8 Wh (16.08 kWh)',
    'Charge voltage: 56.16 V',
    'Maximum charge current: 150 A',
    'Maximum discharge current: 200 A',
    'Discharge voltage range: 45.6 to 56.16 V',
    '# Mechanical',
    'Dimensions (W x D x H): 866 x 450 x 230 mm',
    'Weight: 119 kg',
    '# Interface',
    'Display: LED indicator and LCD display',
    'Communication: RS232, RS485, CAN',
    '# Environment',
    'Charge temperature: 0 to +45 C',
    'Discharge temperature: -20 to +45 C',
    'Storage temperature, short term (within 1 month): -10 to +45 C',
    'Storage temperature, long term (within 1 year): 0 to +35 C'
  ]
),

(
  'LVTS-512560',
  '28.6 kWh in one cabinet, which is the point where a battery stops being backup and becomes the house supply after dark. 560 Ah at 51.2 V behind a colour touchscreen, so the state of the system is read off the battery itself rather than off an app. 240 kg on a floor stand — this one is sited once, on a slab, and left alone.',
  0, null, null, true,
  '/products/lvtopsun-lvts-512560.webp',
  'https://www.lvtopsun.com/lvts-512560-residential-photovoltaic-energy-storage-lithium-ion-battery-product/',
  null,
  array[
    '# Performance',
    'Battery type: LiFePO4',
    'Nominal voltage: 51.2 V DC',
    'Nominal capacity: 560 Ah',
    'Battery energy: 28.6 kWh',
    'Charge current: 150 A',
    'Charge power: 7.68 kW',
    'Discharge current: 200 A',
    'Discharge power: 10.24 kW',
    'Short circuit current: 540 A',
    '# Mechanical',
    'Dimensions (W x D x H): 800 x 325 x 900 mm',
    'Weight: 240 kg',
    'Installation: Floor stand',
    '# Interface',
    'Display: Colour touchscreen',
    'Communication: CAN, RS485, RS232',
    '# Environment',
    'Charge temperature: 0 to +55 C',
    'Discharge temperature: -20 to +55 C'
  ]
),


-- ---------------------------------------------------------------------------
-- 2. THE 25.6 V WALL UNIT
--
--    The small end of the range: a 12 V-class system stepped up to 24 V, for
--    a pump, a shop, a rest house or a first battery somebody means to add to.
-- ---------------------------------------------------------------------------

(
  'LVTS-256100',
  '25.6 V wall unit, 2.56 kWh, 26 kg on a bracket — the small end of the range, for a sari-sari store, a rest house, a solar pump or a first battery a customer means to grow. 100 Ah in, 100 A out at 2560 W, with the charge state on an LCD on the front. Mounts on the wall beside the inverter instead of taking floor space.',
  0, null, null, true,
  '/products/lvtopsun-lvts-256100.webp',
  'https://www.lvtopsun.com/lvts-256100-residential-photovoltaic-energy-storage-lithium-ion-battery-product/',
  null,
  array[
    '# Performance',
    'Battery type: LiFePO4',
    'Nominal voltage: 25.6 V DC',
    'Nominal capacity: 100 Ah',
    'Battery energy: 2.56 kWh',
    'Charge current: 50 A',
    'Charge power: 1280 W',
    'Discharge current: 100 A',
    'Discharge power: 2560 W',
    'Short circuit current: approx. 2000 A',
    '# Mechanical',
    'Dimensions (W x D x H): 330 x 135 x 420 mm',
    'Weight: 26 kg',
    'Installation: Wall mount',
    '# Interface',
    'Display: LCD display',
    '# Environment',
    'Working temperature: -20 to +60 C'
  ]
)

on conflict (name) do update set
  description    = excluded.description,
  is_active      = excluded.is_active,
  image_url      = excluded.image_url,
  datasheet_url  = excluded.datasheet_url,
  manual_url     = excluded.manual_url,
  specifications = excluded.specifications;


-- ---------------------------------------------------------------------------
-- 3. TYPE AND VOLTAGE CLASS
--
--    Same reasoning as every earlier catalogue file: the shop's filter bar
--    runs entirely off these two columns, so a row left unset is invisible to
--    every filter no matter how complete its specification is.
--
--    All four are batteries, and all four are low voltage — 51.2 V and
--    25.6 V nominal, well under the 1500 V DC the filter chip means by it.
-- ---------------------------------------------------------------------------
update public.products set category = 'battery', voltage_class = 'low'
 where name in (
   'LVTS-512300-G3', 'LVTS-512314-G3', 'LVTS-512560', 'LVTS-256100'
 );

commit;

-- ---------------------------------------------------------------------------
-- Check. Four rows, every one active, priced 0, filed under battery / low,
-- with a specification, a photograph and a link back to its LVTOPSUN product
-- page — waiting on the back office for a real peso figure.
-- ---------------------------------------------------------------------------
select name,
       category,
       voltage_class,
       retail_price,
       stock_quantity,
       array_length(specifications, 1) as spec_lines,
       (image_url is not null)         as has_photo,
       (datasheet_url is not null)     as has_product_link
  from public.products
 where name in (
   'LVTS-512300-G3', 'LVTS-512314-G3', 'LVTS-512560', 'LVTS-256100'
 )
 order by name;