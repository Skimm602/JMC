-- ===========================================================================
--  Run this ONCE in the Supabase SQL editor.
--  Dashboard -> SQL Editor -> New query -> paste ALL of this -> Run.
--
--  The real HYXiPOWER range, as the storefront sells it: seven models across
--  the four families the header menu lists. Every specification line below is
--  transcribed from the manufacturer datasheet linked on the same row —
--  HYX-H(6-8)K-LS V1.3, HYX-H(3-8)K-HS V1.2, HYX-E(50-100)-H3 V1.5 and
--  HYX-E160-L V1.0 — and not from a product page, because the pages round and
--  occasionally contradict the PDF, and the PDF is what an installer will be
--  holding when something does not match on site.
--
--  NO PRICES ARE SET HERE. Every row lands with retail_price 0, which the
--  storefront reads as "not priced yet": the product is browsable, its
--  specification and datasheet are readable, and it cannot be ordered. Put the
--  real pesos in from the back office —
--
--      /admin/maintenance -> the product -> Retail price / Installer price
--
--  and the line starts selling the moment it has a figure. Nothing else needs
--  switching on.
--
--  SAFE TO RE-RUN. A second run refreshes the descriptions, specifications,
--  images and document links from this file, and deliberately leaves
--  retail_price, installer_price and stock_quantity exactly as the back office
--  set them. Correcting a spec here can never wipe a price.
-- ===========================================================================

begin;

-- Upserting by name needs name to be unique, which it should have been all
-- along: two catalogue rows called the same thing is a support call waiting
-- to happen. This fails loudly if duplicates already exist, which is the
-- right time to find out.
create unique index if not exists products_name_key on public.products (name);


-- ---------------------------------------------------------------------------
-- 1. THE RANGE
--
--    stock_quantity is left NULL rather than 0. Null means the shelf is not
--    being counted for this line yet; zero means counted, and none left. The
--    storefront shows a red "Out of stock" badge for the second and nothing
--    for the first, and a product that has never been stocked has not sold
--    out of anything.
-- ---------------------------------------------------------------------------

insert into public.products
  (name, description, retail_price, installer_price, stock_quantity, is_active,
   image_url, datasheet_url, manual_url, specifications)
values

-- ============================ H-LS SERIES ==================================
(
  'HYX-H6K-LS',
  'Low-voltage single-phase hybrid inverter, 6 kW. Starts making power at 60 V, so the array is working at dawn and still working under cloud. Two AC outputs split critical loads from the rest, up to six units run in parallel, and the 90-280 V grid window covers provincial supply that a narrower inverter would trip on.',
  0, null, null, true,
  '/products/h6-8k-ls.png',
  'https://webfile.hyxipower.com/soft/20260513/HYX-H(6-8)K-LS_Datasheet_V1.3-20260402_EN.pdf',
  'https://webfile.hyxipower.com/soft/20260618/UM_HYX-H(6-8)K-LS_User-Manual_V1.2-20260608_EN.pdf',
  array[
    '# Battery input',
    'Battery type: Lithium-ion or lead-acid',
    'Rated battery voltage: 48 V',
    'Battery voltage range: 40 - 60 V',
    'Max. charging current: 125 A',
    'Max. discharging current: 125 A',
    'Charging strategy for Li-ion: Self-adaption to BMS',
    '# PV input',
    'Max. MPPT input power: 12000 W',
    'Max. PV input voltage: 500 V',
    'Rated PV input voltage: 370 V',
    'Start-up voltage: 60 V',
    'MPPT voltage range: 60 - 450 V',
    'No. of MPPT / strings per MPPT: 2 / 1+1',
    'Max. PV input current per MPPT: 18 + 18 A',
    'Max. short circuit current per MPPT: 27 + 27 A',
    '# AC input (grid and generator)',
    'Rated AC input voltage: 220 / 230 / 240 V',
    'Rated AC input voltage range: 90 - 280 V',
    'Rated input frequency: 50 / 60 Hz',
    'Max. AC input current: 40 A',
    'Total current harmonic distortion: < 3 %',
    '# Backup output',
    'Rated output power: 6000 W',
    'Rated AC output current: 27 A',
    'Rated output frequency: 50 / 60 Hz',
    'Peak power: 1.1x rated 60 s; 1.5x rated 10 s; 2x rated 5 s; above 2x rated 100 ms',
    'Switch time: 20 ms',
    'Total current harmonic distortion: < 3 %',
    '# Efficiency',
    'Max. efficiency: 97.0 %',
    'MPPT efficiency: 99.9 %',
    'Efficiency standard: IEC 61683:1999',
    '# Protection',
    'Integrated protections: DC polarity reverse connection, AC output overcurrent, thermal, AC output overvoltage, AC output short circuit, DC component monitoring, overvoltage load drop, power network monitoring, earth fault detection',
    'Surge protection level: Type II (DC), Type II (AC)',
    'Over voltage category: OVC II (DC), OVC III (AC)',
    '# General',
    'Operating temperature range: -40 to +60 C (derating above 45 C)',
    'Dimensions (W x H x D): 430 x 350 x 177.8 mm',
    'Weight: 16 kg',
    'Topology: Non-isolated',
    'Cooling: Intelligent air cooling',
    'Max. operating altitude: 3000 m',
    'Ingress protection: IP66',
    'Communication: RS485 / CAN / dry contact / external battery NTC / parallel communication / Wi-Fi (built-in)',
    'Warranty: 5 years',
    'Safety / EMC standard: IEC 62109-1 / -2, EN 61000-6-1:2019, EN 61000-6-3:2021, EN 61000-3-11:2019, EN 61000-3-12:2011'
  ]
),
(
  'HYX-H8K-LS',
  'Low-voltage single-phase hybrid inverter, 8 kW. The larger half of the H-LS platform: same 60 V start-up and 90-280 V grid window, with 165 A of battery charge and discharge instead of 125 A. Up to six units in parallel for on-grid and off-grid operation, and a diesel generator input for sites that still need one.',
  0, null, null, true,
  '/products/h6-8k-ls.png',
  'https://webfile.hyxipower.com/soft/20260513/HYX-H(6-8)K-LS_Datasheet_V1.3-20260402_EN.pdf',
  'https://webfile.hyxipower.com/soft/20260618/UM_HYX-H(6-8)K-LS_User-Manual_V1.2-20260608_EN.pdf',
  array[
    '# Battery input',
    'Battery type: Lithium-ion or lead-acid',
    'Rated battery voltage: 48 V',
    'Battery voltage range: 40 - 60 V',
    'Max. charging current: 165 A',
    'Max. discharging current: 165 A',
    'Charging strategy for Li-ion: Self-adaption to BMS',
    '# PV input',
    'Max. MPPT input power: 12000 W',
    'Max. PV input voltage: 500 V',
    'Rated PV input voltage: 370 V',
    'Start-up voltage: 60 V',
    'MPPT voltage range: 60 - 450 V',
    'No. of MPPT / strings per MPPT: 2 / 1+1',
    'Max. PV input current per MPPT: 18 + 18 A',
    'Max. short circuit current per MPPT: 27 + 27 A',
    '# AC input (grid and generator)',
    'Rated AC input voltage: 220 / 230 / 240 V',
    'Rated AC input voltage range: 90 - 280 V',
    'Rated input frequency: 50 / 60 Hz',
    'Max. AC input current: 50 A',
    'Total current harmonic distortion: < 3 %',
    '# Backup output',
    'Rated output power: 8000 W',
    'Rated AC output current: 35 A',
    'Rated output frequency: 50 / 60 Hz',
    'Peak power: 1.1x rated 60 s; 1.5x rated 10 s; 2x rated 5 s; above 2x rated 100 ms',
    'Switch time: 20 ms',
    'Total current harmonic distortion: < 3 %',
    '# Efficiency',
    'Max. efficiency: 97.0 %',
    'MPPT efficiency: 99.9 %',
    'Efficiency standard: IEC 61683:1999',
    '# Protection',
    'Integrated protections: DC polarity reverse connection, AC output overcurrent, thermal, AC output overvoltage, AC output short circuit, DC component monitoring, overvoltage load drop, power network monitoring, earth fault detection',
    'Surge protection level: Type II (DC), Type II (AC)',
    'Over voltage category: OVC II (DC), OVC III (AC)',
    '# General',
    'Operating temperature range: -40 to +60 C (derating above 45 C)',
    'Dimensions (W x H x D): 430 x 350 x 177.8 mm',
    'Weight: 16 kg',
    'Topology: Non-isolated',
    'Cooling: Intelligent air cooling',
    'Max. operating altitude: 3000 m',
    'Ingress protection: IP66',
    'Communication: RS485 / CAN / dry contact / external battery NTC / parallel communication / Wi-Fi (built-in)',
    'Warranty: 5 years',
    'Safety / EMC standard: IEC 62109-1 / -2, EN 61000-6-1:2019, EN 61000-6-3:2021, EN 61000-3-11:2019, EN 61000-3-12:2011'
  ]
),

-- ============================ H-HS SERIES ==================================
(
  'HYX-H6K-HS',
  'High-voltage single-phase hybrid inverter, 6 kW. The high-voltage half of the same platform: an 80-490 V battery bus, 200 percent DC oversizing and sub-10 ms transfer. AFCI detection reaches 300 m of string and shuts down in half a second, which is the part that matters on a roof nobody can reach quickly.',
  0, null, null, true,
  '/products/h6-8k-hs.png',
  'https://webfile.hyxipower.com/soft/20250226/DS_HYX-H(3-8)K-HS_Datasheet_V1.2-2024_EN.pdf',
  'https://webfile.hyxipower.com/soft/20250226/UM_HYX-H(3-8)K-HS_User-Manual_V1.4-202407_EN(AU)1.pdf',
  array[
    '# PV input',
    'Max. array power: 12000 W',
    'Max. input power: 5000 W / 4600 W',
    'Max. input voltage: 600 V',
    'Start-up voltage: 50 V',
    'MPPT operating voltage range: 80 - 560 V',
    'Max. input current: 32 A (16 / 16)',
    'Max. short-circuit current: 48 A (24 / 24)',
    'Number of MPPTs: 2',
    'PV inputs (strings per MPPT): 2 (1 / 1)',
    '# AC input and output',
    'Nominal power: 6000 W',
    'Max. apparent power: 6600 VA',
    'Nominal current: 27.2 A',
    'Max. current: 30.0 A',
    'Nominal voltage: 1 / N / PE, 220 / 230 / 240 V',
    'AC voltage range: 154 - 276 V',
    'Total current harmonic distortion: < 3 %',
    'Frequency: 50 / 45-55 Hz; 60 / 55-65 Hz',
    'Adjustable power factor: 0.8 leading to 0.8 lagging',
    'DC current injection: < 0.5 % In',
    '# Backup (AC output)',
    'Nominal output power: 6000 VA',
    'Max. continuous output apparent power: 6600 VA',
    'Peak output power: 9000 W for 10 s',
    'Max. output current: 30.0 A',
    'Switch time: < 10 ms',
    '# Battery',
    'Battery type: LiFePO4',
    'Battery voltage range: 80 - 490 V',
    'Max. charge / discharge current: 35 A',
    'Max. charge / discharge power: 8000 W',
    '# Efficiency',
    'Max. efficiency: 98.60 %',
    'European weighted efficiency: 98.20 %',
    'MPPT efficiency: 99.90 %',
    'Battery charge / discharge efficiency: 97.50 %',
    '# Protection',
    'DC insulation resistance detection: Yes',
    'Residual current monitoring: Yes',
    'DC reverse polarity protection: Yes',
    'DC / AC surge protection: Type II',
    'DC switch: Yes',
    'Anti-islanding protection: Yes',
    'AC over current protection: Yes',
    'AC short-circuit protection: Yes',
    'AC over voltage protection: Yes',
    'Grounded fault detection: Yes',
    '# General',
    'Operating temperature range: -25 to +60 C',
    'Relative operating humidity: 0 - 100 %RH',
    'Max. operating altitude: 4000 m',
    'Cooling: Natural cooling',
    'Display: LED / app / web',
    'Communication: CAN / RS485 / Wi-Fi / 4G / LAN',
    'Weight: 20 kg',
    'Dimensions (W x H x D): 522 x 416 x 177.6 mm',
    'Degree of protection: IP65',
    'Mounting: Wall mounted'
  ]
),
(
  'HYX-H8K-HS',
  'High-voltage single-phase hybrid inverter, 8 kW. The largest of the HS range: 16 kW of array on two MPPTs, 8 kVA of backup and a 9.6 kW ten-second peak for motor starting. IP65 with C4 salt spray resistance, which is what coastal installations in the Philippines actually need.',
  0, null, null, true,
  '/products/h6-8k-hs.png',
  'https://webfile.hyxipower.com/soft/20250226/DS_HYX-H(3-8)K-HS_Datasheet_V1.2-2024_EN.pdf',
  'https://webfile.hyxipower.com/soft/20250226/UM_HYX-H(3-8)K-HS_User-Manual_V1.4-202407_EN(AU)1.pdf',
  array[
    '# PV input',
    'Max. array power: 16000 W',
    'Max. input power: 6400 W / 6400 W',
    'Max. input voltage: 600 V',
    'Start-up voltage: 50 V',
    'MPPT operating voltage range: 80 - 560 V',
    'Max. input current: 32 A (16 / 16)',
    'Max. short-circuit current: 48 A (24 / 24)',
    'Number of MPPTs: 2',
    'PV inputs (strings per MPPT): 2 (1 / 1)',
    '# AC input and output',
    'Nominal power: 8000 W',
    'Max. apparent power: 8800 VA',
    'Nominal current: 36.3 A',
    'Max. current: 40.0 A',
    'Nominal voltage: 1 / N / PE, 220 / 230 / 240 V',
    'AC voltage range: 154 - 276 V',
    'Total current harmonic distortion: < 3 %',
    'Frequency: 50 / 45-55 Hz; 60 / 55-65 Hz',
    'Adjustable power factor: 0.8 leading to 0.8 lagging',
    'DC current injection: < 0.5 % In',
    '# Backup (AC output)',
    'Nominal output power: 8000 VA',
    'Max. continuous output apparent power: 8000 VA',
    'Peak output power: 9600 W for 10 s',
    'Max. output current: 36.3 A',
    'Switch time: < 10 ms',
    '# Battery',
    'Battery type: LiFePO4',
    'Battery voltage range: 80 - 490 V',
    'Max. charge / discharge current: 35 A',
    'Max. charge / discharge power: 8000 W',
    '# Efficiency',
    'Max. efficiency: 98.60 %',
    'European weighted efficiency: 98.20 %',
    'MPPT efficiency: 99.90 %',
    'Battery charge / discharge efficiency: 97.50 %',
    '# Protection',
    'DC insulation resistance detection: Yes',
    'Residual current monitoring: Yes',
    'DC reverse polarity protection: Yes',
    'DC / AC surge protection: Type II',
    'DC switch: Yes',
    'Anti-islanding protection: Yes',
    'AC over current protection: Yes',
    'AC short-circuit protection: Yes',
    'AC over voltage protection: Yes',
    'Grounded fault detection: Yes',
    '# General',
    'Operating temperature range: -25 to +60 C',
    'Relative operating humidity: 0 - 100 %RH',
    'Max. operating altitude: 4000 m',
    'Cooling: Natural cooling',
    'Display: LED / app / web',
    'Communication: CAN / RS485 / Wi-Fi / 4G / LAN',
    'Weight: 20 kg',
    'Dimensions (W x H x D): 522 x 416 x 177.6 mm',
    'Degree of protection: IP65',
    'Mounting: Wall mounted'
  ]
),

-- ============================ E-H3 SERIES ==================================
(
  'HYX-E50-H3',
  'High-voltage LiFePO4 battery, 5.12 kWh. The breaker, fuse and cell-temperature sensing are already inside, so the install is a mount and a pair of cables rather than a cabinet build. Wall-mounted where there is wall, floor-mounted where there is not, and stackable to 20 kWh.',
  0, null, null, true,
  '/products/e50-100-h3.png',
  'https://webfile.hyxipower.com/soft/20260123/DS_HYX-E(50-100)-H3_Datasheet_V1.5-20260120_EN-(Preliminary).pdf',
  'https://webfile.hyxipower.com/soft/20260429/UM_HYX-E(50-100)-H3_User-manual_V1.6-20260427_EN.pdf',
  array[
    '# Battery system',
    'Total battery capacity: 5.12 kWh',
    'Usable capacity: 4.6 kWh',
    'Nominal voltage: 102.4 V',
    'Working voltage: 86.4 - 115.2 V',
    'Cell type: LiFePO4',
    'Nominal charge / discharge current: 25 A',
    'Max. charge / discharge current: 30 A',
    'Peak charge / discharge current: 60 A (10 s at 25 C)',
    'Calendar life: Over 6000 cycles (70 % EOL)',
    '# Mechanical',
    'Dimensions (W x H x D): 498 x 535 x 185.7 mm',
    'Net weight: 56 kg',
    'Installation: Wall-mounted, floor-mounted',
    '# Indicators and communication',
    'SOC indicator: 4 x LED (25, 50, 75, 100 %)',
    'State indicator: 2 x LED (work, alarm)',
    'Communication: CAN, RS485',
    '# Environment',
    'Working temperature: Charge 0 to +55 C; discharge -20 to +55 C',
    'Working humidity: 5 - 95 %RH',
    'Ingress protection rating: IP65',
    'Altitude: Up to 3000 m',
    '# Notes',
    'Usable capacity test conditions: 100 % depth of discharge, 0.2C charge and discharge at 25 C, at the beginning of service life',
    'Datasheet status: Version 1.5 preliminary'
  ]
),
(
  'HYX-E100-H3',
  'High-voltage LiFePO4 battery, 10.4 kWh. The same integrated pack as the E50-H3 at double the capacity and 208 V nominal, for a house that runs through the evening rather than over a peak. Wall or floor mounted, IP65, and scalable to 20 kWh.',
  0, null, null, true,
  '/products/e50-100-h3.png',
  'https://webfile.hyxipower.com/soft/20260123/DS_HYX-E(50-100)-H3_Datasheet_V1.5-20260120_EN-(Preliminary).pdf',
  'https://webfile.hyxipower.com/soft/20260429/UM_HYX-E(50-100)-H3_User-manual_V1.6-20260427_EN.pdf',
  array[
    '# Battery system',
    'Total battery capacity: 10.4 kWh',
    'Usable capacity: 9.36 kWh',
    'Nominal voltage: 208 V',
    'Working voltage: 175.5 - 234 V',
    'Cell type: LiFePO4',
    'Nominal charge / discharge current: 25 A',
    'Max. charge / discharge current: 30 A',
    'Peak charge / discharge current: 60 A (10 s at 25 C)',
    'Calendar life: Over 6000 cycles (70 % EOL)',
    '# Mechanical',
    'Dimensions (W x H x D): 640 x 730 x 185 mm',
    'Net weight: 105 kg',
    'Installation: Wall-mounted, floor-mounted',
    '# Indicators and communication',
    'SOC indicator: 4 x LED (25, 50, 75, 100 %)',
    'State indicator: 2 x LED (work, alarm)',
    'Communication: CAN, RS485',
    '# Environment',
    'Working temperature: Charge 0 to +55 C; discharge -20 to +55 C',
    'Working humidity: 5 - 95 %RH',
    'Ingress protection rating: IP65',
    'Altitude: Up to 3000 m',
    '# Notes',
    'Usable capacity test conditions: 100 % depth of discharge, 0.2C charge and discharge at 25 C, at the beginning of service life',
    'Datasheet status: Version 1.5 preliminary'
  ]
),

-- ============================= E-L SERIES ==================================
(
  'HYX-E160-L',
  'Low-voltage battery cabinet, 16.07 kWh. 314 Ah at 51.2 V in a cabinet one person can move on its own wheels, and fifteen of them in parallel if the load asks for it. The commercial answer where a stack of small wall units would be fifteen sets of terminations to inspect.',
  0, null, null, true,
  '/products/e160-l.png',
  'https://webfile.hyxipower.com/soft/20260416/HYX-E160-L_Datasheet_V1.0-20260123_EN.pdf',
  'https://webfile.hyxipower.com/soft/20260513/UM_HYX-E160-L_User-manual_V1.0-20260330_EN.pdf',
  array[
    '# Performance',
    'Battery type: Lithium-ion',
    'Rated energy: 16.07 kWh',
    'Rated voltage: 51.2 V DC',
    'Rated capacity: 314 Ah',
    'Rated charge current: 157 A',
    'Rated discharge current: 157 A',
    'Max. continuous charge current: 200 A',
    'Max. continuous discharge current: 200 A',
    'Cycle life: 6000 cycles (90 % DOD, 80 % SOH)',
    'Parallel connection: Up to 15 units (241.05 kWh)',
    'Communication: RS485 / CAN 2.0',
    'Display: LED display',
    'Protection: Double safety control (BMS and circuit protection), over-temperature, over-current, short-circuit, over-charge and over-discharge protection',
    '# Mechanical',
    'Dimensions (W x H x D): 490 x 830 x 230 mm',
    'Weight: 130 kg',
    'Installation: Floor mounted',
    '# Environment',
    'Storage temperature: -20 to +60 C',
    'Discharge temperature: -20 to +55 C',
    'Charge temperature: 0 to +55 C',
    'Relative humidity: Up to 85 %',
    'Protection level: IP20',
    'Altitude: Up to 2000 m',
    'Cooling: Natural cooling',
    '# Certification',
    'Transport: UN 38.3',
    '# Notes',
    'Rated energy test conditions: 25 C, at the beginning of life'
  ]
)

on conflict (name) do update set
  description    = excluded.description,
  is_active      = excluded.is_active,
  image_url      = excluded.image_url,
  datasheet_url  = excluded.datasheet_url,
  manual_url     = excluded.manual_url,
  specifications = excluded.specifications;
  -- retail_price, installer_price and stock_quantity are deliberately absent.
  -- They belong to the back office, and a spec correction re-run from this
  -- file must never reach across and reset them.


-- ---------------------------------------------------------------------------
-- 2. THE TEST ROWS
--
--    'test1' and 'Testing' were placeholders from before the catalogue was
--    loaded. They are deactivated rather than deleted: order_items may still
--    reference them, an order is a record of what was agreed rather than a
--    live view of the catalogue, and deactivating is reversible in one click
--    from /admin/maintenance. They disappear from the shop either way.
-- ---------------------------------------------------------------------------
update public.products
   set is_active = false
 where name in ('test1', 'Testing');

commit;

-- ---------------------------------------------------------------------------
-- Check. Seven active rows, every one of them carrying a full specification
-- and both documents, and every price still waiting to be set.
-- ---------------------------------------------------------------------------
select name,
       retail_price,
       stock_quantity,
       array_length(specifications, 1) as spec_lines,
       (datasheet_url is not null)     as has_datasheet,
       (manual_url is not null)        as has_manual
  from public.products
 where is_active
 order by name;
