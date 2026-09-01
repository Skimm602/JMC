-- ===========================================================================
--  Run this ONCE in the Supabase SQL editor.
--  Dashboard -> SQL Editor -> New query -> paste ALL of this -> Run.
--
--  Schneider Electric circuit breakers, taken from the Philippine catalogue
--  page the shop was asked to work from:
--
--    se.com/ph/en/product-category/4200-circuit-breakers-and-switches/
--      ?filter=business-4-low-voltage-products-and-systems
--
--  ONE ROW PER RANGE, not per reference. That page carries roughly 3,000
--  individual Schneider references behind fourteen breaker ranges, and a shop
--  grid with three thousand near-identical cards on it is not a shop. The
--  range is also the unit a customer actually asks for on the phone — "an
--  EasyPact EZC, 100 amp, three pole" — so the range is the row, and the
--  rating is settled on the quote. Each row links back to its own se.com
--  range page, which is where the full reference list lives.
--
--  CIRCUIT BREAKERS ONLY, as asked. The same category page also lists switch
--  disconnectors (ComPact INS/INV, Interpact INS/INV, ComPact NSXm NA),
--  source changeover switches (TransferPacT), breaker interfaces and gateways
--  (Enerlin''X IF and FDM) and the PowerLogic HeatTag sensor. None of those
--  are breakers and none of them are here.
--
--  WHERE THE CONTENT COMES FROM
--    - Names, taglines and long descriptions: the range records embedded in
--      that category page, so the shop calls each range what Schneider calls
--      it in the Philippines.
--    - Photographs: Schneider''s own product images, pulled at full
--      resolution from download.schneider-electric.com using the p_Doc_Ref
--      each range card carries, then converted to WebP into
--      /public/products. Downloaded rather than hotlinked, same as every
--      other product in this catalogue.
--    - Specifications: deliberately kept to range-level facts that are stated
--      on se.com itself or legible on the official product photograph, plus
--      the standard each family is built to. Per-reference figures — the
--      exact Icu at a given voltage, the trip curve, the frame — differ
--      across a range and belong on the quote, not on a range card. Nothing
--      here is guessed.
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
-- 0. LET THE CATEGORY COLUMN HOLD 'accessory'
--
--    products.category carries a check constraint that was added by hand in
--    the Supabase dashboard rather than by any file in this repository, back
--    when the shop sold nothing but inverters and batteries — so it permits
--    those two and rejects everything else:
--
--      ERROR 23514: new row for relation "products" violates check
--      constraint "products_category_check"
--
--    The application has allowed three categories for a while — see the
--    validation in src/app/actions/catalogue.js — so this is the database
--    catching up with the code rather than a new rule. The breakers are the
--    first accessories the shop has ever listed, which is why nothing has hit
--    it before now.
--
--    The old definition is printed to the Messages pane before it is replaced,
--    so there is a record of what was there. Null stays legal: rows predating
--    the category column have none, and failing them here would block every
--    later edit to an old product for no gain.
-- ---------------------------------------------------------------------------
do $$
declare
  existing text;
begin
  select pg_get_constraintdef(oid) into existing
    from pg_constraint
   where conrelid = 'public.products'::regclass
     and conname = 'products_category_check';

  if existing is null then
    raise notice 'products_category_check did not exist; adding it.';
  else
    raise notice 'Replacing products_category_check. Previous definition: %', existing;
    alter table public.products drop constraint products_category_check;
  end if;

  alter table public.products
    add constraint products_category_check
    check (category is null or category in ('inverter', 'battery', 'accessory'));
end
$$;


-- ---------------------------------------------------------------------------
-- 1. MOULDED-CASE CIRCUIT BREAKERS (MCCB)
--
--    The working range for a commercial switchboard: everything from a 15 A
--    final circuit up to a 3200 A incomer.
-- ---------------------------------------------------------------------------

insert into public.products
  (name, description, retail_price, installer_price, stock_quantity, is_active,
   image_url, datasheet_url, manual_url, specifications)
values

(
  'EasyPact EZC',
  'Schneider moulded-case breaker with fixed thermal-magnetic settings, 15 A to 630 A, one to four poles. The straightforward choice for a distribution board that needs a dependable main or feeder breaker and nothing clever — order the frame and the rating, fit it, done. Stocked to order across the full 24-rating spread.',
  0, null, null, true,
  '/products/schneider-easypact-ezc.webp',
  'https://www.se.com/ph/en/product-range/997-easypact-ezc/',
  null,
  array[
    '# Range',
    'Device type: Moulded-case circuit breaker (MCCB), fixed settings',
    'Rated current: 15 - 630 A',
    'Poles: 1P, 2P, 3P, 4P',
    'Trip unit ratings: 15, 20, 25, 30, 32, 40, 50, 60, 63, 75, 80, 100, 125, 150, 160, 175, 200, 225, 250, 320, 350, 400, 500, 600 A',
    'References in the range on se.com/ph: 178',
    '# Ratings, as marked on the EZC100H',
    'Rated insulation voltage Ui: 690 V',
    'Impulse withstand voltage Uimp: 6 kV',
    'Breaking capacity Icu: 50 kA at 220/230/240 V AC',
    'Breaking capacity Icu: 30 kA at 380/400/415 V AC',
    'Breaking capacity Icu: 20 kA at 440 V AC, 10 kA at 550 V AC',
    'Breaking capacity Icu: 10 kA at 125 V DC and 250 V DC',
    'Service breaking capacity Ics: 50% Icu at 110-400 V, 25% Icu at 415-550 V',
    '# Standards',
    'Standards: IEC 60947-2, JIS C8201-2-1',
    'Utilisation category: A',
    'Frequency: 50/60 Hz',
    'Ambient temperature: 40/50 C'
  ]
),

(
  'EasyPact CVS',
  'Adjustable-setting moulded-case breaker, 16 A to 630 A. Where the EZC is fixed, the CVS lets the trip be set on site, so one frame covers a range of loads and a switchboard can be tuned for discrimination instead of re-ordered. Thermal-magnetic or MicroLogic electronic trip.',
  0, null, null, true,
  '/products/schneider-easypact-cvs.webp',
  'https://www.se.com/ph/en/product-range/61052-easypact-cvs/',
  null,
  array[
    '# Range',
    'Device type: Moulded-case circuit breaker (MCCB), adjustable settings',
    'Rated current: 16 - 630 A',
    'Poles: 3P, 4P',
    'Trip units: Thermal-magnetic and MicroLogic electronic',
    'Application: Small to medium-sized buildings',
    'References in the range on se.com/ph: 284',
    '# Standards',
    'Standard: IEC 60947-2'
  ]
),

(
  'EasyPact CVS 800-1600A',
  'The top of the EasyPact CVS range, 800 A to 1600 A with adjustable settings — the incomer on a medium building where a full ComPacT NS is more breaker than the job needs. Electronic trip throughout.',
  0, null, null, true,
  '/products/schneider-easypact-cvs-800-1600.webp',
  'https://www.se.com/ph/en/product-range/318395899-easypact-cvs-8001600a/',
  null,
  array[
    '# Range',
    'Device type: Moulded-case circuit breaker (MCCB), adjustable settings',
    'Rated current: 800 - 1600 A',
    'Poles: 3P, 4P',
    'Trip units: MicroLogic electronic',
    'Application: Small to medium-sized buildings',
    'References in the range on se.com/ph: 11',
    '# Standards',
    'Standard: IEC 60947-2'
  ]
),

(
  'ComPacT NSX',
  'Schneider flagship moulded-case breaker, protecting lines up to 630 A. Sixty-five years of the Compact line, now with MicroLogic trip units that meter the circuit as well as protect it — energy, power quality and trip history readable from the front or over Modbus. Specified where uptime and maintenance planning matter as much as the trip curve.',
  0, null, null, true,
  '/products/schneider-compact-nsx.webp',
  'https://www.se.com/ph/en/product-range/39910531-compact-nsx-new-generation/',
  null,
  array[
    '# Range',
    'Device type: Moulded-case circuit breaker (MCCB)',
    'Rated current: up to 630 A',
    'Poles: 3P, 4P',
    'Trip units: Thermal-magnetic and MicroLogic electronic',
    'References in the range on se.com/ph: 1,094',
    '# Digital',
    'Embedded metering and trip history on MicroLogic trip units',
    'Communication: Modbus and Ethernet through Enerlin''X interfaces',
    '# Standards',
    'Standard: IEC 60947-2'
  ]
),

(
  'ComPacT NS',
  'The large-frame Compact, protecting lines up to 3200 A. Where the switchboard incomer is past what a 630 A frame can carry but an air circuit breaker is more cabinet than the room allows. MicroLogic electronic trip throughout.',
  0, null, null, true,
  '/products/schneider-compact-ns.webp',
  'https://www.se.com/ph/en/product-range/39910560-compact-ns-new-generation/',
  null,
  array[
    '# Range',
    'Device type: Moulded-case circuit breaker (MCCB)',
    'Rated current: up to 3200 A',
    'Poles: 3P, 4P',
    'Trip units: MicroLogic electronic',
    'References in the range on se.com/ph: 383',
    '# Standards',
    'Standard: IEC 60947-2'
  ]
),


-- ---------------------------------------------------------------------------
-- 2. AIR CIRCUIT BREAKERS (ACB)
--
--    Switchboard incomers, 800 A and up. Drawout construction, so the breaker
--    comes out for service without the busbar coming down.
-- ---------------------------------------------------------------------------

(
  'EasyPact MVS',
  'Air circuit breaker, 800 A to 4000 A, in a single frame size across the whole range — one set of spares, one set of accessories, one mounting cutout no matter the rating. Built for the incomer position on a switchboard where cost and reliability matter more than deep digital metering.',
  0, null, null, true,
  '/products/schneider-easypact-mvs.webp',
  'https://www.se.com/ph/en/product-range/61227-easypact-mvs/',
  null,
  array[
    '# Range',
    'Device type: Air circuit breaker (ACB)',
    'Rated current: 800 - 4000 A',
    'Frame sizes: One, across the whole range',
    'Poles: 3P, 4P',
    'Position: Switchboard incomer',
    'References in the range on se.com/ph: 738',
    '# Standards',
    'Standard: IEC 60947-2'
  ]
),

(
  'MasterPact NW',
  'The air circuit breaker the industry benchmarks against, 800 A to 6300 A across two frame sizes. MicroLogic control units handle overload, short circuit and equipment earth fault, and report the load while they do it. Drawout construction as standard.',
  0, null, null, true,
  '/products/schneider-masterpact-nw.webp',
  'https://www.se.com/ph/en/product-range/1007-masterpact-nw/',
  null,
  array[
    '# Range',
    'Device type: Air circuit breaker (ACB)',
    'Rated current: 800 - 6300 A',
    'Frame sizes: Two, covering the whole range',
    'Poles: 3P, 4P',
    'Trip units: MicroLogic control units',
    'Protection: Overload, short circuit and equipment earth fault',
    'References in the range on se.com/ph: 98',
    '# Standards',
    'Standard: IEC 60947-2'
  ]
),

(
  'MasterPact MTZ X',
  'The digital MasterPact, up to 6300 A, running MicroLogic X control units. Settings, metering, waveform capture and trip history come off the breaker over Bluetooth or the network rather than out of a logbook — which is what turns a shutdown into a scheduled job instead of a discovery.',
  0, null, null, true,
  '/products/schneider-masterpact-mtz-x.webp',
  'https://www.se.com/ph/en/product-range/63545-masterpact-mtz-x/',
  null,
  array[
    '# Range',
    'Device type: Air circuit breaker (ACB)',
    'Rated current: up to 6300 A',
    'Poles: 3P, 4P',
    'Trip units: MicroLogic X control units',
    'Protection: Overload, short circuit and equipment earth fault',
    'References in the range on se.com/ph: 268',
    '# Digital',
    'Embedded metering, waveform capture and trip history',
    '# Standards',
    'Standard: IEC 60947-2'
  ]
),

(
  'MasterPact MTZ Active',
  'The current-generation MasterPact, up to 6300 A, built around continuous operation — 24/7 uptime, energy accounting and a service model that does not need the board dead to read it.',
  0, null, null, true,
  '/products/schneider-masterpact-mtz-active.webp',
  'https://www.se.com/ph/en/product-range/235999471-masterpact-mtz-active/',
  null,
  array[
    '# Range',
    'Device type: Air circuit breaker (ACB)',
    'Rated current: up to 6300 A',
    'Poles: 3P, 4P',
    'Trip units: MicroLogic control units',
    'References in the range on se.com/ph: 233',
    '# Standards',
    'Standard: IEC 60947-2'
  ]
),

(
  'MasterPact NT/NW UL 489',
  'MasterPact built and listed to UL 489 rather than IEC, 800 A to 5000 A in two frame sizes — the range to quote when the specification, the insurer or the client''s parent company is written to American standards. MicroLogic control units throughout.',
  0, null, null, true,
  '/products/schneider-masterpact-nt-nw-ul489.webp',
  'https://www.se.com/ph/en/product-range/1509-masterpact-nt-nw-ul-489-listed/',
  null,
  array[
    '# Range',
    'Device type: Air circuit breaker (ACB), UL 489 listed',
    'Rated current: 800 - 5000 A',
    'Frame sizes: Two',
    'Poles: 3P, 4P',
    'Trip units: MicroLogic control units',
    'Protection: Overload, short circuit and equipment earth fault',
    'References in the range on se.com/ph: 8',
    '# Standards',
    'Standard: UL 489'
  ]
),


-- ---------------------------------------------------------------------------
-- 3. MINIATURE CIRCUIT BREAKERS (MCB)
--
--    The Philippine residential and light-commercial standard: Square D
--    plug-on and bolt-on breakers for load centres, not DIN rail.
-- ---------------------------------------------------------------------------

(
  'QO and QOB Circuit Breakers',
  'Square D QO plug-on and QOB bolt-on breakers — the load-centre breaker most Philippine houses and small commercial boards are already built around. The Visi-Trip window shows a red flag on the pole that actually tripped, so a fault is found by looking at the board instead of resetting every breaker on it.',
  0, null, null, true,
  '/products/schneider-qo-qob.webp',
  'https://www.se.com/ph/en/product-range/7229-qo-and-qob-circuit-breakers/',
  null,
  array[
    '# Range',
    'Device type: Miniature circuit breaker (MCB)',
    'Mounting: QO plug-on and QOB bolt-on, for Square D load centres',
    'References in the range on se.com/ph: 23',
    '# Ratings, as marked on the QO120',
    'Rated voltage: 120/240 V AC',
    'Interrupting rating: 10 kA',
    '# Features',
    'Visi-Trip: red indicator identifies the tripped pole at a glance'
  ]
),

(
  'HomeLine Circuit Breakers',
  'Square D Homeline plug-on breakers for Homeline load centres — the value line in the Schneider miniature range, and the one to reach for when a residential board is being extended rather than rebuilt.',
  0, null, null, true,
  '/products/schneider-homeline.webp',
  'https://www.se.com/ph/en/product-range/7228-homeline-circuit-breakers/',
  null,
  array[
    '# Range',
    'Device type: Miniature circuit breaker (MCB)',
    'Mounting: Plug-on, for Homeline load centres',
    'Application: Residential and light commercial',
    'References in the range on se.com/ph: 1'
  ]
),


-- ---------------------------------------------------------------------------
-- 4. MOTOR CIRCUIT BREAKERS
--
--    Breakers with a motor-protection trip characteristic rather than a
--    distribution one — pumps, compressors, conveyors.
-- ---------------------------------------------------------------------------

(
  'TeSys GV2',
  'Motor circuit-breaker for machines from 0.37 kW to 15 kW. One device does the isolation, the short-circuit protection and the thermal overload that a motor actually needs, which is a shorter panel and one less thing to co-ordinate than a breaker plus a separate overload relay.',
  0, null, null, true,
  '/products/schneider-tesys-gv2.webp',
  'https://www.se.com/ph/en/product-range/1978-local-tesys-gv2-motor-circuitbreakers/',
  null,
  array[
    '# Range',
    'Device type: Motor circuit-breaker',
    'Motor rating: 0.37 - 15 kW',
    'Protection: Isolation, short circuit and thermal overload in one device',
    'References in the range on se.com/ph: 26',
    '# Standards',
    'Standards: IEC 60947-2, IEC 60947-4-1'
  ]
),

(
  'Compact NS80H MA',
  'Moulded-case breaker with a magnetic-only trip, for motor circuits up to 37 kW. The MA trip leaves the thermal protection to the contactor and overload relay and handles the short circuit itself, which is how a motor starter is co-ordinated properly.',
  0, null, null, true,
  '/products/schneider-compact-ns80h-ma.webp',
  'https://www.se.com/ph/en/product-range/995-compact-ns80h-ma/',
  null,
  array[
    '# Range',
    'Device type: Moulded-case circuit breaker (MCCB) for motor protection',
    'Motor rating: up to 37 kW',
    'Trip unit: MA, magnetic only',
    'References in the range on se.com/ph: 3',
    '# Standards',
    'Standard: IEC 60947-2'
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
-- 5. TYPE AND VOLTAGE CLASS
--
--    Same reasoning as the two earlier catalogue files: the shop''s filter bar
--    runs entirely off these two columns, so a row left unset is invisible to
--    every filter no matter how complete its specification is.
--
--    Every one of these is an accessory in this shop''s sense — the parts an
--    install needs beyond the inverter and the battery — and every one is a
--    low-voltage device in the IEC sense, which is what the filter chip says.
-- ---------------------------------------------------------------------------
update public.products set category = 'accessory', voltage_class = 'low'
 where name in (
   'EasyPact EZC', 'EasyPact CVS', 'EasyPact CVS 800-1600A',
   'ComPacT NSX', 'ComPacT NS',
   'EasyPact MVS', 'MasterPact NW', 'MasterPact MTZ X',
   'MasterPact MTZ Active', 'MasterPact NT/NW UL 489',
   'QO and QOB Circuit Breakers', 'HomeLine Circuit Breakers',
   'TeSys GV2', 'Compact NS80H MA'
 );

commit;

-- ---------------------------------------------------------------------------
-- Check. Fourteen rows, every one active, priced 0, filed under accessory,
-- with a specification, a photograph and a link back to its se.com range
-- page — waiting on the back office for a real peso figure.
-- ---------------------------------------------------------------------------
select name,
       category,
       voltage_class,
       retail_price,
       stock_quantity,
       array_length(specifications, 1) as spec_lines,
       (image_url is not null)         as has_photo,
       (datasheet_url is not null)     as has_range_link
  from public.products
 where name in (
   'EasyPact EZC', 'EasyPact CVS', 'EasyPact CVS 800-1600A',
   'ComPacT NSX', 'ComPacT NS',
   'EasyPact MVS', 'MasterPact NW', 'MasterPact MTZ X',
   'MasterPact MTZ Active', 'MasterPact NT/NW UL 489',
   'QO and QOB Circuit Breakers', 'HomeLine Circuit Breakers',
   'TeSys GV2', 'Compact NS80H MA'
 )
 order by name;
