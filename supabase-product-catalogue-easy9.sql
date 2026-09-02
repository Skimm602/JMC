-- ===========================================================================
--  Run this ONCE in the Supabase SQL editor.
--  Dashboard -> SQL Editor -> New query -> paste ALL of this -> Run.
--
--  REPLACES the circuit-breaker line. The fourteen Schneider MCCB and ACB
--  ranges added by supabase-product-catalogue-breakers.sql come out, and the
--  Easy9 miniature circuit breaker goes in, 16 A to 63 A, from the reference
--  the shop was asked to work from:
--
--    se.com/ph/en/product/EZ9F56216/
--      miniature-circuit-breaker-easy9-2p-16-a-c-curve-10000-a/
--
--  WHY THIS IS A BETTER LINE. The fourteen ranges that come out were frame
--  sizes up to 3200 A — switchgear for a commercial switchboard, quoted per
--  project, none of it priced. The Easy9 is the breaker a solar install
--  actually consumes: the DIN-rail MCB that lands in the AC combiner beside
--  the inverter. Seven ratings a customer can point at beats fourteen ranges
--  they have to ring up about.
--
--  ONE ROW PER RATING, not per range, which is the opposite of the file this
--  replaces and deliberately so. A range card is right when the range holds
--  hundreds of references and the rating is settled on the quote. Here the
--  rating IS the choice — 16, 20, 25, 32, 40, 50, 63 A — and there are only
--  seven of them, so each gets its own row, its own Schneider reference and
--  its own photograph with its own reference printed on the label.
--
--  TWO POLE, C CURVE, 10 kA, as linked. Easy9 is also made in 1P and 3P and
--  in 6 A and 10 A; none of those are here, because the brief named the 2P
--  and named 16 A to 63 A. Adding a pole count later is another seven rows
--  in this same shape.
--
--  WHERE THE CONTENT COMES FROM
--    - Names: 'Easy9 MCB 2P <rating> A', so the shelf sorts by rating and the
--      customer reads the choice off the card. The Schneider reference is the
--      first line of every specification.
--    - Photographs: Schneider's own product photography, pulled at 1500 px
--      from download.schneider-electric.com per reference, then converted to
--      WebP into /public/products. Seven distinct photographs, not one reused
--      seven times — each shows its own reference on the label.
--    - Specifications: transcribed from the structured product record on each
--      reference's own se.com page. Every figure below the rated current is
--      identical across the seven, because the Easy9 2P is one device in
--      seven ratings. Nothing here is guessed.
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
-- 1. TAKE THE FOURTEEN MCCB AND ACB RANGES OUT
--
--    Not a blind DELETE. `order_items` was created in the Supabase dashboard
--    rather than by any file in this repository, so its foreign key onto
--    products is not something this file can read ahead of time — and the two
--    ways it could be declared are both bad if we guess wrong. ON DELETE
--    CASCADE would take the line items of real past orders out with the
--    product; NO ACTION would abort the whole migration at this point.
--
--    So: a range that has never been ordered is deleted outright, and a range
--    that appears on any order is retired instead — is_active false, which is
--    what the storefront reads as "not for sale" — so the order history it is
--    attached to stays readable. The Messages pane below says which happened.
--
--    Cart rows are not worth protecting the same way: supabase-cart.sql
--    declares ON DELETE CASCADE on cart_items.product_id, and a breaker
--    sitting in somebody's cart at price 0 was never going to check out.
-- ---------------------------------------------------------------------------
do $$
declare
  retired  text[];
  removed  text[];
  doomed   text[] := array[
    'EasyPact EZC', 'EasyPact CVS', 'EasyPact CVS 800-1600A',
    'ComPacT NSX', 'ComPacT NS',
    'EasyPact MVS', 'MasterPact NW', 'MasterPact MTZ X',
    'MasterPact MTZ Active', 'MasterPact NT/NW UL 489',
    'QO and QOB Circuit Breakers', 'HomeLine Circuit Breakers',
    'TeSys GV2', 'Compact NS80H MA'
  ];
begin
  if to_regclass('public.order_items') is null then
    -- No order history table at all, so nothing to protect.
    with gone as (
      delete from public.products where name = any (doomed) returning name
    )
    select coalesce(array_agg(name order by name), array[]::text[]) into removed from gone;
    retired := array[]::text[];
  else
    -- Retire anything that appears on an order.
    with kept as (
      update public.products p
         set is_active = false
       where p.name = any (doomed)
         and exists (select 1 from public.order_items oi where oi.product_id = p.id)
      returning p.name
    )
    select coalesce(array_agg(name order by name), array[]::text[]) into retired from kept;

    -- Delete everything else.
    with gone as (
      delete from public.products p
       where p.name = any (doomed)
         and not exists (select 1 from public.order_items oi where oi.product_id = p.id)
      returning p.name
    )
    select coalesce(array_agg(name order by name), array[]::text[]) into removed from gone;
  end if;

  raise notice 'Deleted % breaker range(s): %',
    coalesce(array_length(removed, 1), 0), coalesce(array_to_string(removed, ', '), '(none)');
  raise notice 'Retired (kept for order history) % range(s): %',
    coalesce(array_length(retired, 1), 0), coalesce(array_to_string(retired, ', '), '(none)');
end
$$;


-- ---------------------------------------------------------------------------
-- 2. THE EASY9 MINIATURE CIRCUIT BREAKER, 16 A TO 63 A
--
--    One device in seven ratings. Everything below the rated current is the
--    same across all seven: 2P, C curve, 10 kA at 220 V AC to IEC 60898-1,
--    36 mm wide on DIN rail.
--
--    The application note on each row is the circuit that rating is usually
--    put on in a Philippine house. It is a starting point for the enquiry,
--    not a design: the breaker is sized against the actual load and the
--    actual cable by the electrician doing the work.
-- ---------------------------------------------------------------------------

insert into public.products
  (name, description, retail_price, installer_price, stock_quantity, is_active,
   image_url, datasheet_url, manual_url, specifications)
values

(
  'Easy9 MCB 2P 16 A',
  'Schneider Easy9 two-pole miniature circuit breaker, 16 A, C curve. The small end of the range — lighting circuits and general outlets, and the rating most often asked for when a solar install needs a breaker on a sub-circuit rather than on the main. Two modules on the DIN rail, 10 kA breaking capacity, handle position tells you at a glance whether it tripped.',
  0, null, null, true,
  '/products/schneider-easy9-mcb-2p-16a.webp',
  'https://www.se.com/ph/en/product/EZ9F56216/miniature-circuit-breaker-easy9-2p-16-a-c-curve-10000-a/',
  null,
  array[
    '# Reference',
    'Schneider reference: EZ9F56216',
    'Range: Easy9',
    'Device type: Miniature circuit breaker (MCB)',
    '# Rating',
    'Rated current In: 16 A',
    'Poles: 2P, 2 protected poles',
    'Tripping curve: C',
    'Rated short-circuit breaking capacity: 10000 A at 220 V AC (IEC 60898-1)',
    'Operational voltage Ue: 220 V AC',
    'Rated insulation voltage Ui: 500 V AC',
    'Rated impulse withstand voltage Uimp: 4 kV',
    'Operating frequency: 50 / 60 Hz',
    '# Protection',
    'Protection: Short circuit, and cable protection against overload',
    'Fault indication: Handle position on the front panel (O-I engraved)',
    'Application: Residential and small commercial buildings',
    '# Endurance',
    'Electrical endurance: 4000 cycles',
    'Mechanical endurance: 10000 cycles',
    '# Mechanical',
    'Mounting: DIN rail',
    'Width: 4 pitches of 9 mm',
    'Dimensions (W x H x D): 36 x 81 x 66.5 mm',
    'Colour: Light grey (RAL 7035)',
    '# Environment',
    'Degree of protection: IP20, IP40 in enclosure (IEC 60529)',
    'Operating temperature: -5 to 60 C',
    'Storage temperature: -40 to 85 C',
    '# Standards',
    'Standard: IEC 60898-1'
  ]
),

(
  'Easy9 MCB 2P 20 A',
  'Schneider Easy9 two-pole miniature circuit breaker, 20 A, C curve. Steps up from the 16 A for general power circuits — convenience outlets carrying more than lighting, a small appliance run. Same two-module body, same 10 kA, same DIN rail.',
  0, null, null, true,
  '/products/schneider-easy9-mcb-2p-20a.webp',
  'https://www.se.com/ph/en/product/EZ9F56220/miniature-circuit-breaker-easy9-2p-20-a-c-curve-10000-a/',
  null,
  array[
    '# Reference',
    'Schneider reference: EZ9F56220',
    'Range: Easy9',
    'Device type: Miniature circuit breaker (MCB)',
    '# Rating',
    'Rated current In: 20 A',
    'Poles: 2P, 2 protected poles',
    'Tripping curve: C',
    'Rated short-circuit breaking capacity: 10000 A at 220 V AC (IEC 60898-1)',
    'Operational voltage Ue: 220 V AC',
    'Rated insulation voltage Ui: 500 V AC',
    'Rated impulse withstand voltage Uimp: 4 kV',
    'Operating frequency: 50 / 60 Hz',
    '# Protection',
    'Protection: Short circuit, and cable protection against overload',
    'Fault indication: Handle position on the front panel (O-I engraved)',
    'Application: Residential and small commercial buildings',
    '# Endurance',
    'Electrical endurance: 4000 cycles',
    'Mechanical endurance: 10000 cycles',
    '# Mechanical',
    'Mounting: DIN rail',
    'Width: 4 pitches of 9 mm',
    'Dimensions (W x H x D): 36 x 81 x 66.5 mm',
    'Colour: Light grey (RAL 7035)',
    '# Environment',
    'Degree of protection: IP20, IP40 in enclosure (IEC 60529)',
    'Operating temperature: -5 to 60 C',
    'Storage temperature: -40 to 85 C',
    '# Standards',
    'Standard: IEC 60898-1'
  ]
),

(
  'Easy9 MCB 2P 25 A',
  'Schneider Easy9 two-pole miniature circuit breaker, 25 A, C curve. The rating a water heater or a window-type aircon usually lands on, and a common choice for the AC side of a small hybrid inverter. C curve rides the start-up surge without nuisance tripping.',
  0, null, null, true,
  '/products/schneider-easy9-mcb-2p-25a.webp',
  'https://www.se.com/ph/en/product/EZ9F56225/miniature-circuit-breaker-easy9-2p-25-a-c-curve-10000-a/',
  null,
  array[
    '# Reference',
    'Schneider reference: EZ9F56225',
    'Range: Easy9',
    'Device type: Miniature circuit breaker (MCB)',
    '# Rating',
    'Rated current In: 25 A',
    'Poles: 2P, 2 protected poles',
    'Tripping curve: C',
    'Rated short-circuit breaking capacity: 10000 A at 220 V AC (IEC 60898-1)',
    'Operational voltage Ue: 220 V AC',
    'Rated insulation voltage Ui: 500 V AC',
    'Rated impulse withstand voltage Uimp: 4 kV',
    'Operating frequency: 50 / 60 Hz',
    '# Protection',
    'Protection: Short circuit, and cable protection against overload',
    'Fault indication: Handle position on the front panel (O-I engraved)',
    'Application: Residential and small commercial buildings',
    '# Endurance',
    'Electrical endurance: 4000 cycles',
    'Mechanical endurance: 10000 cycles',
    '# Mechanical',
    'Mounting: DIN rail',
    'Width: 4 pitches of 9 mm',
    'Dimensions (W x H x D): 36 x 81 x 66.5 mm',
    'Colour: Light grey (RAL 7035)',
    '# Environment',
    'Degree of protection: IP20, IP40 in enclosure (IEC 60529)',
    'Operating temperature: -5 to 60 C',
    'Storage temperature: -40 to 85 C',
    '# Standards',
    'Standard: IEC 60898-1'
  ]
),

(
  'Easy9 MCB 2P 32 A',
  'Schneider Easy9 two-pole miniature circuit breaker, 32 A, C curve. Split-type aircon and cooking-range territory, and the usual AC breaker for a 6 kW to 8 kW hybrid inverter. The busiest rating in the range on a solar job.',
  0, null, null, true,
  '/products/schneider-easy9-mcb-2p-32a.webp',
  'https://www.se.com/ph/en/product/EZ9F56232/miniature-circuit-breaker-easy9-2p-32-a-c-curve-10000-a/',
  null,
  array[
    '# Reference',
    'Schneider reference: EZ9F56232',
    'Range: Easy9',
    'Device type: Miniature circuit breaker (MCB)',
    '# Rating',
    'Rated current In: 32 A',
    'Poles: 2P, 2 protected poles',
    'Tripping curve: C',
    'Rated short-circuit breaking capacity: 10000 A at 220 V AC (IEC 60898-1)',
    'Operational voltage Ue: 220 V AC',
    'Rated insulation voltage Ui: 500 V AC',
    'Rated impulse withstand voltage Uimp: 4 kV',
    'Operating frequency: 50 / 60 Hz',
    '# Protection',
    'Protection: Short circuit, and cable protection against overload',
    'Fault indication: Handle position on the front panel (O-I engraved)',
    'Application: Residential and small commercial buildings',
    '# Endurance',
    'Electrical endurance: 4000 cycles',
    'Mechanical endurance: 10000 cycles',
    '# Mechanical',
    'Mounting: DIN rail',
    'Width: 4 pitches of 9 mm',
    'Dimensions (W x H x D): 36 x 81 x 66.5 mm',
    'Colour: Light grey (RAL 7035)',
    '# Environment',
    'Degree of protection: IP20, IP40 in enclosure (IEC 60529)',
    'Operating temperature: -5 to 60 C',
    'Storage temperature: -40 to 85 C',
    '# Standards',
    'Standard: IEC 60898-1'
  ]
),

(
  'Easy9 MCB 2P 40 A',
  'Schneider Easy9 two-pole miniature circuit breaker, 40 A, C curve. Feeder rating — a sub-board off the main, a large inverter unit, a heavy appliance circuit. Still two modules wide, so it drops into the same rail as the 16 A next to it.',
  0, null, null, true,
  '/products/schneider-easy9-mcb-2p-40a.webp',
  'https://www.se.com/ph/en/product/EZ9F56240/miniature-circuit-breaker-easy9-2p-40-a-c-curve-10000-a/',
  null,
  array[
    '# Reference',
    'Schneider reference: EZ9F56240',
    'Range: Easy9',
    'Device type: Miniature circuit breaker (MCB)',
    '# Rating',
    'Rated current In: 40 A',
    'Poles: 2P, 2 protected poles',
    'Tripping curve: C',
    'Rated short-circuit breaking capacity: 10000 A at 220 V AC (IEC 60898-1)',
    'Operational voltage Ue: 220 V AC',
    'Rated insulation voltage Ui: 500 V AC',
    'Rated impulse withstand voltage Uimp: 4 kV',
    'Operating frequency: 50 / 60 Hz',
    '# Protection',
    'Protection: Short circuit, and cable protection against overload',
    'Fault indication: Handle position on the front panel (O-I engraved)',
    'Application: Residential and small commercial buildings',
    '# Endurance',
    'Electrical endurance: 4000 cycles',
    'Mechanical endurance: 10000 cycles',
    '# Mechanical',
    'Mounting: DIN rail',
    'Width: 4 pitches of 9 mm',
    'Dimensions (W x H x D): 36 x 81 x 66.5 mm',
    'Colour: Light grey (RAL 7035)',
    '# Environment',
    'Degree of protection: IP20, IP40 in enclosure (IEC 60529)',
    'Operating temperature: -5 to 60 C',
    'Storage temperature: -40 to 85 C',
    '# Standards',
    'Standard: IEC 60898-1'
  ]
),

(
  'Easy9 MCB 2P 50 A',
  'Schneider Easy9 two-pole miniature circuit breaker, 50 A, C curve. Sub-main rating: the breaker feeding a second panel, or the AC side of a 10 kW class hybrid inverter. Near the top of what a modular MCB is asked to carry before the job moves to a moulded case.',
  0, null, null, true,
  '/products/schneider-easy9-mcb-2p-50a.webp',
  'https://www.se.com/ph/en/product/EZ9F56250/miniature-circuit-breaker-easy9-2p-50-a-c-curve-10000-a/',
  null,
  array[
    '# Reference',
    'Schneider reference: EZ9F56250',
    'Range: Easy9',
    'Device type: Miniature circuit breaker (MCB)',
    '# Rating',
    'Rated current In: 50 A',
    'Poles: 2P, 2 protected poles',
    'Tripping curve: C',
    'Rated short-circuit breaking capacity: 10000 A at 220 V AC (IEC 60898-1)',
    'Operational voltage Ue: 220 V AC',
    'Rated insulation voltage Ui: 500 V AC',
    'Rated impulse withstand voltage Uimp: 4 kV',
    'Operating frequency: 50 / 60 Hz',
    '# Protection',
    'Protection: Short circuit, and cable protection against overload',
    'Fault indication: Handle position on the front panel (O-I engraved)',
    'Application: Residential and small commercial buildings',
    '# Endurance',
    'Electrical endurance: 4000 cycles',
    'Mechanical endurance: 10000 cycles',
    '# Mechanical',
    'Mounting: DIN rail',
    'Width: 4 pitches of 9 mm',
    'Dimensions (W x H x D): 36 x 81 x 66.5 mm',
    'Colour: Light grey (RAL 7035)',
    '# Environment',
    'Degree of protection: IP20, IP40 in enclosure (IEC 60529)',
    'Operating temperature: -5 to 60 C',
    'Storage temperature: -40 to 85 C',
    '# Standards',
    'Standard: IEC 60898-1'
  ]
),

(
  'Easy9 MCB 2P 63 A',
  'Schneider Easy9 two-pole miniature circuit breaker, 63 A, C curve. The top of the Easy9 range and the usual main incomer for a small residential board — one device isolating the whole panel, with 10 kA of breaking capacity behind it.',
  0, null, null, true,
  '/products/schneider-easy9-mcb-2p-63a.webp',
  'https://www.se.com/ph/en/product/EZ9F56263/miniature-circuit-breaker-easy9-2p-63-a-c-curve-10000-a/',
  null,
  array[
    '# Reference',
    'Schneider reference: EZ9F56263',
    'Range: Easy9',
    'Device type: Miniature circuit breaker (MCB)',
    '# Rating',
    'Rated current In: 63 A',
    'Poles: 2P, 2 protected poles',
    'Tripping curve: C',
    'Rated short-circuit breaking capacity: 10000 A at 220 V AC (IEC 60898-1)',
    'Operational voltage Ue: 220 V AC',
    'Rated insulation voltage Ui: 500 V AC',
    'Rated impulse withstand voltage Uimp: 4 kV',
    'Operating frequency: 50 / 60 Hz',
    '# Protection',
    'Protection: Short circuit, and cable protection against overload',
    'Fault indication: Handle position on the front panel (O-I engraved)',
    'Application: Residential and small commercial buildings',
    '# Endurance',
    'Electrical endurance: 4000 cycles',
    'Mechanical endurance: 10000 cycles',
    '# Mechanical',
    'Mounting: DIN rail',
    'Width: 4 pitches of 9 mm',
    'Dimensions (W x H x D): 36 x 81 x 66.5 mm',
    'Colour: Light grey (RAL 7035)',
    '# Environment',
    'Degree of protection: IP20, IP40 in enclosure (IEC 60529)',
    'Operating temperature: -5 to 60 C',
    'Storage temperature: -40 to 85 C',
    '# Standards',
    'Standard: IEC 60898-1'
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
--    The shop's filter bar runs entirely off these two columns, so a row left
--    unset is invisible to every filter no matter how complete its
--    specification is. All seven are accessories in this shop's sense — the
--    parts an install needs beyond the inverter and the battery — and all
--    seven are low-voltage devices in the IEC sense.
-- ---------------------------------------------------------------------------
update public.products set category = 'accessory', voltage_class = 'low'
 where name in (
   'Easy9 MCB 2P 16 A', 'Easy9 MCB 2P 20 A', 'Easy9 MCB 2P 25 A',
   'Easy9 MCB 2P 32 A', 'Easy9 MCB 2P 40 A', 'Easy9 MCB 2P 50 A',
   'Easy9 MCB 2P 63 A'
 );

commit;

-- ---------------------------------------------------------------------------
-- Check. Seven rows, every one active, priced 0, filed under accessory / low,
-- each with a specification, a photograph and a link back to its own se.com
-- reference page — waiting on the back office for a real peso figure.
--
-- The second query should return NO rows: it looks for any of the fourteen
-- old ranges still listed for sale.
-- ---------------------------------------------------------------------------
select name,
       category,
       voltage_class,
       retail_price,
       array_length(specifications, 1) as spec_lines,
       (image_url is not null)         as has_photo,
       (datasheet_url is not null)     as has_reference_link
  from public.products
 where name like 'Easy9 MCB%'
 order by name;

select name, is_active
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
