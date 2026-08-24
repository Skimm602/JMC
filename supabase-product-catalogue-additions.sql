-- ===========================================================================
--  Run this ONCE in the Supabase SQL editor.
--  Dashboard -> SQL Editor -> New query -> paste ALL of this -> Run.
--
--  Ten specific models added to the catalogue, the same way
--  supabase-product-catalogue-seed.sql added HYXiPOWER: one row per model,
--  specifications transcribed from each manufacturer's own datasheet PDF
--  rather than the marketing page, images downloaded into /public/products
--  rather than hotlinked.
--
--  This is the trimmed set actually wanted — not every wattage a
--  manufacturer's product page lists, only these:
--
--    LuxpowerTek, GEN2 hybrid only  ->  6K, 10K, 12K            (3 rows)
--    SolaX                          ->  T-BAT-SYS-LV D150        (1 row)
--    Solis S6-EH1P                  ->  6K, 8K, 12K, 16K         (4 rows)
--    GoodWe ES Uniq                 ->  GW6000-ES-C10, GW12K-ES-C10 (2 rows)
--
--  The 6K LuxpowerTek model comes off the GEN2-LB-EU 3-6K datasheet; 10K and
--  12K do not exist on that page at all — LuxpowerTek's GEN2 line splits by
--  wattage the same way HYXiPOWER did, so those two come from the separate
--  GEN2-LB-EU 7-14K datasheet instead. Both are GEN2, which is what was
--  asked for — LuxpowerTek also sells a 12K under the older, non-GEN2
--  LXP-LB-EU name; that one is deliberately not used here.
--
--  The Solis 6K/8K come off the 3-10K datasheet, 12K/16K off the 12-18K
--  one — two different PDFs for one manufacturer, same as LuxpowerTek.
--
--  NO PRICES ARE SET HERE. Every row lands with retail_price 0,
--  stock_quantity null — browsable and specced, not orderable until an admin
--  sets a real price from /admin/maintenance.
--
--  SAFE TO RE-RUN. A second run refreshes description/specs/images/documents
--  and leaves retail_price, installer_price and stock_quantity exactly as the
--  back office set them.
-- ===========================================================================

begin;

create unique index if not exists products_name_key on public.products (name);


-- ---------------------------------------------------------------------------
-- 1. LUXPOWERTEK GEN2-LB-EU — SINGLE-PHASE HYBRID INVERTER
--
--    6K from the GEN2-LB-EU 3-6K datasheet; 10K and 12K from the separate
--    GEN2-LB-EU 7-14K datasheet — two different PDFs, both GEN2.
-- ---------------------------------------------------------------------------

insert into public.products
  (name, description, retail_price, installer_price, stock_quantity, is_active,
   image_url, datasheet_url, manual_url, specifications)
values

(
  'GEN2-LB-EU 6K',
  'LuxpowerTek single-phase hybrid inverter, 6 kW. Two MPPTs share a 530 V window with a 100 V start-up, so the array is producing early in the day. Dedicated generator and smart-load ports plus AC coupling cover a retrofit onto an existing grid-tie system, and up to ten units run in parallel for both on- and off-grid installs.',
  0, null, null, true,
  '/products/luxpowertek-gen2-lb-eu-6k.webp',
  'https://luxpowertek.com/wp-content/uploads/2025/10/GEN2-LB-EU-3-6K-Datasheet.pdf',
  'https://luxpowertek.com/wp-content/uploads/2025/12/LuxpowerTek-GEN2-LB-EU-3-6K-User-manual-ENGLISH-Hybrid-SINGLE-Phase-inverter.pdf',
  array[
    '# PV input',
    'Max. PV input power: 9600 W',
    'Rated PV input voltage: 360 V',
    'Number of independent MPPT inputs: 2 (1:1)',
    'Max. PV input voltage: 530 V',
    'MPPT voltage range: 150 - 425 V',
    'Start-up voltage: 100 V',
    'Max. PV input current per MPPT: 18 / 18 A',
    'Max. PV short-circuit current per MPPT: 32 / 32 A',
    '# Battery',
    'Compatible battery type: Lithium-ion / Lead-acid',
    'Rated battery voltage: 48 V',
    'Battery voltage range: 40 - 60 V',
    'Max. charging/discharging current: 125 / 140 A',
    'Max. charging/discharging power: 6000 W',
    'Force wake up battery from PV: Yes',
    '# Grid',
    'Rated AC voltage: 230 V',
    'Rated AC frequency: 50 / 60 Hz',
    'Rated AC output current: 26 A',
    'Rated AC output power: 6000 W',
    'Max. AC input power: 12000 W',
    'Power factor: 0.99 (adjustable 0.8 leading to 0.8 lagging)',
    'THDI: < 3 %',
    'Max. continuous AC passthrough current: 52.2 A',
    '# Generator input',
    'Rated GEN voltage: 230 V',
    'Rated GEN frequency: 50 / 60 Hz',
    'Rated GEN input current: 40 A',
    'Rated GEN input power: 9200 W',
    '# UPS / backup output',
    'Rated output power: 6000 W',
    'Rated output voltage: 230 V',
    'Rated output current: 26 A',
    'Rated output frequency: 50 / 60 Hz',
    'Surge power: 2x rated power for 0.5 s',
    'Switching time: 7 ms',
    'Waveform: Sine wave',
    'THDV: < 5 %',
    '# Efficiency',
    'MPPT efficiency: 99.9 %',
    'Max. efficiency: 97.3 %',
    'Max. charge/discharge efficiency: 94.5 %',
    '# Protection',
    'Integrated protections: over current/voltage, anti-islanding, AC short-circuit, leakage current, ground fault monitoring, grid monitoring, DC switch',
    'DC surge protection: Type III',
    'AC surge protection: Type III',
    '# General',
    'Dimensions (W x H x D): 440 x 528 x 220 mm',
    'Weight: 25 kg',
    'Ingress protection: NEMA4X / IP66',
    'Operating temperature range: -25 to +60 C',
    'Storage temperature range: -40 to +65 C',
    'Relative humidity: 0 - 100 %',
    'Cooling: Smart cooling',
    'Noise emission: 50 dB',
    'Display & communication: LCD + RGB, RS485 / Wi-Fi / CAN',
    'Topology: Transformer-less (AC side), transformer (battery side)',
    'Max. operating altitude: 2000 m',
    'DC connector: MC4',
    'Warranty: 5 / 10 years',
    'Standards & certification: EN 62109 / EN 61000, IEC 62116, IEC 61727, IEC 61683, G100 / G99 / G98, PIPEREE Type A, CEI 0-21:2022'
  ]
),
(
  'GEN2-LB-EU 10K',
  'LuxpowerTek single-phase hybrid inverter, 10 kW, the larger GEN2 platform built for bigger residential and small-commercial loads. Three MPPTs cover an 18 kW array, generator, smart-load and AC-coupling ports are each independent, and AI-driven time-of-use optimisation shifts load against tariff automatically. Up to ten units run in parallel.',
  0, null, null, true,
  '/products/luxpowertek-gen2-lb-eu-7-14k-front.webp',
  'https://luxpowertek.com/wp-content/uploads/2026/02/GEN2-LB-EU-7-14K-Datasheet20260206.pdf',
  'https://luxpowertek.com/wp-content/uploads/2026/03/GEN2-LB-EU-7-14K-User-Manual-2025.7.1.pdf',
  array[
    '# PV input',
    'Max. PV input power: 15000 W',
    'Rated PV input voltage: 340 V',
    'Number of independent MPPT inputs: 3 (1:1:1)',
    'Max. PV input voltage: 550 V',
    'MPPT voltage range: 120 - 440 V',
    'Start-up voltage: 100 V',
    'Max. PV input current per MPPT: 26 / 15 / 15 A',
    'Max. PV short-circuit current per MPPT: 31 / 18 / 18 A',
    '# Battery',
    'Compatible battery type: Lithium-ion / Lead-acid',
    'Rated battery voltage: 48 V',
    'Battery voltage range: 40 - 60 V',
    'Max. charging/discharging current: 210 A',
    'Max. charging/discharging power: 10000 W',
    'Force wake up battery from PV: Yes',
    '# Grid',
    'Rated AC voltage: 230 V',
    'Rated AC frequency: 50 / 60 Hz',
    'Rated AC output current: 43.5 A',
    'Rated AC output power: 10000 W',
    'Acceptable input voltage range: 180 - 270 V',
    'Max. AC input current: 100 A',
    'Max. AC input power: 18000 W',
    'Power factor: 0.99 (adjustable 0.8 leading to 0.8 lagging)',
    'THDI: < 5 %',
    'Max. continuous AC passthrough current: 100 A',
    '# Generator input',
    'Rated GEN voltage: 230 V',
    'Rated GEN frequency: 50 / 60 Hz',
    'Rated GEN input current: 80 A',
    'Rated GEN input power: 18000 W',
    '# UPS / backup output',
    'Rated output power: 10000 W @ 230 V',
    'Rated output voltage: 230 V',
    'Rated output current: 43.5 A',
    'Rated output frequency: 50 / 60 Hz',
    'Surge power: 2x rated power for 0.5 s',
    'Switching time: Single unit 10 ms, parallel 20 ms',
    'Waveform: Sine wave',
    'THDV: < 3 %',
    '# Efficiency',
    'MPPT efficiency: 99.9 %',
    'Max. charge/discharge efficiency: 95.0 %',
    '# Protection',
    'Integrated protections: over current/voltage, AC short-circuit, grid monitoring, DC switch',
    'AC/DC surge protection: Type III',
    '# General',
    'Dimensions (W x H x D): 520 x 653 x 275 mm',
    'Weight: 47.5 kg',
    'Ingress protection: IP66',
    'Operating temperature range: -25 to +60 C (derating above 45 C)',
    'Storage temperature range: -25 to +60 C',
    'Relative humidity: 0 - 100 %',
    'Cooling: Smart cooling',
    'Noise emission: 55 dB',
    'Display & communication: Touch colour screen, RS485 / Wi-Fi / CAN',
    'Topology: Transformer-less (AC side), transformer (battery side)',
    'Max. operating altitude: 2000 m',
    'Warranty: 5 / 10 years',
    'Standards & certification: PTPIREE Type A, EN 62109-1 / EN 61000, G100 / G99'
  ]
),
(
  'GEN2-LB-EU 12K',
  'LuxpowerTek single-phase hybrid inverter, 12 kW, the larger GEN2 platform built for bigger residential and small-commercial loads. Three MPPTs cover an 18 kW array, generator, smart-load and AC-coupling ports are each independent, and AI-driven time-of-use optimisation shifts load against tariff automatically. Up to ten units run in parallel.',
  0, null, null, true,
  '/products/luxpowertek-gen2-lb-eu-7-14k-front.webp',
  'https://luxpowertek.com/wp-content/uploads/2026/02/GEN2-LB-EU-7-14K-Datasheet20260206.pdf',
  'https://luxpowertek.com/wp-content/uploads/2026/03/GEN2-LB-EU-7-14K-User-Manual-2025.7.1.pdf',
  array[
    '# PV input',
    'Max. PV input power: 18000 W',
    'Rated PV input voltage: 340 V',
    'Number of independent MPPT inputs: 3 (1:1:1)',
    'Max. PV input voltage: 550 V',
    'MPPT voltage range: 120 - 440 V',
    'Start-up voltage: 100 V',
    'Max. PV input current per MPPT: 26 / 15 / 15 A',
    'Max. PV short-circuit current per MPPT: 31 / 18 / 18 A',
    '# Battery',
    'Compatible battery type: Lithium-ion / Lead-acid',
    'Rated battery voltage: 48 V',
    'Battery voltage range: 40 - 60 V',
    'Max. charging/discharging current: 250 A',
    'Max. charging/discharging power: 12000 W',
    'Force wake up battery from PV: Yes',
    '# Grid',
    'Rated AC voltage: 230 V',
    'Rated AC frequency: 50 / 60 Hz',
    'Rated AC output current: 52 A',
    'Rated AC output power: 12000 W',
    'Acceptable input voltage range: 180 - 270 V',
    'Max. AC input current: 100 A',
    'Max. AC input power: 18000 W',
    'Power factor: 0.99 (adjustable 0.8 leading to 0.8 lagging)',
    'THDI: < 5 %',
    'Max. continuous AC passthrough current: 100 A',
    '# Generator input',
    'Rated GEN voltage: 230 V',
    'Rated GEN frequency: 50 / 60 Hz',
    'Rated GEN input current: 80 A',
    'Rated GEN input power: 18000 W',
    '# UPS / backup output',
    'Rated output power: 12000 W @ 230 V',
    'Rated output voltage: 230 V',
    'Rated output current: 52 A',
    'Rated output frequency: 50 / 60 Hz',
    'Surge power: 2x rated power for 0.5 s',
    'Switching time: Single unit 10 ms, parallel 20 ms',
    'Waveform: Sine wave',
    'THDV: < 3 %',
    '# Efficiency',
    'MPPT efficiency: 99.9 %',
    'Max. charge/discharge efficiency: 95.0 %',
    '# Protection',
    'Integrated protections: over current/voltage, AC short-circuit, grid monitoring, DC switch',
    'AC/DC surge protection: Type III',
    '# General',
    'Dimensions (W x H x D): 520 x 653 x 275 mm',
    'Weight: 47.5 kg',
    'Ingress protection: IP66',
    'Operating temperature range: -25 to +60 C (derating above 45 C)',
    'Storage temperature range: -25 to +60 C',
    'Relative humidity: 0 - 100 %',
    'Cooling: Smart cooling',
    'Noise emission: 55 dB',
    'Display & communication: Touch colour screen, RS485 / Wi-Fi / CAN',
    'Topology: Transformer-less (AC side), transformer (battery side)',
    'Max. operating altitude: 2000 m',
    'Warranty: 5 / 10 years',
    'Standards & certification: PTPIREE Type A, EN 62109-1 / EN 61000, G100 / G99'
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
-- 2. SOLAX T-BAT-SYS-LV D150 — LOW-VOLTAGE LFP BATTERY, 15 kWh
--
--    One SKU. Not a wattage range, so nothing here to trim.
-- ---------------------------------------------------------------------------

insert into public.products
  (name, description, retail_price, installer_price, stock_quantity, is_active,
   image_url, datasheet_url, manual_url, specifications)
values

(
  'T-BAT-SYS-LV D150',
  'A modular low-voltage LFP battery built for expansion — up to 16 units run in parallel off a single 48 V bus, each contributing 15 kWh, 13.5 kWh of it usable at 90% depth of discharge. A 310 A peak discharge for ten seconds and a floor-standing IP65 enclosure suit whole-home backup rather than light topping-up, and remote diagnostics mean a fault does not need someone standing in front of the unit to read it.',
  0, null, null, true,
  '/products/solax-t-bat-sys-lv-d150.png',
  'https://www.solaxpower.com/uploads/file/solax-t-bat-sys-lv-d150-datasheet-en.pdf',
  null,
  array[
    '# Battery',
    'Battery type: LFP',
    'Battery component: 1P5S x 3',
    'Nominal voltage: 48 V',
    'Operating voltage range: 42 - 54 V',
    'Rated capacity: 314 Ah',
    'Nominal energy: 15 kWh',
    'Usable energy (90 % DOD): 13.5 kWh',
    'Max. charge/discharge current: 155 A',
    'Peak discharge current: 310 A, 10 s',
    'Cycle life (90 % DOD): > 6000 cycles',
    '# Communication',
    'Communication interfaces: CAN / RS485',
    '# General',
    'Operating temperature: 0 - 55 C (charge), -20 - 55 C (discharge)',
    'Storage temperature: 30 - 60 C for 6 months, -20 - 30 C for 1 year',
    'Max. parallel number: 16 pcs',
    'Dimensions (L x W x H): 900 x 540 x 220 mm',
    'Weight: 125 kg',
    'Installation type: Floor',
    'Degree of protection: IP65',
    'Cooling concept: Natural cooling',
    'Warranty: 5 years',
    'Max. operating altitude: 3000 m',
    'Certification: UN38.3, IEC62619, CE'
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
-- 3. SOLIS S6-EH1P — LOW-VOLTAGE HYBRID INVERTER
--
--    6K/8K off the S6-EH1P(3-10)K-L-PLUS datasheet; 12K/16K off the separate
--    S6-EH1P(12-18)K-L one — two different PDFs, same as LuxpowerTek.
-- ---------------------------------------------------------------------------

insert into public.products
  (name, description, retail_price, installer_price, stock_quantity, is_active,
   image_url, datasheet_url, manual_url, specifications)
values

(
  'S6-EH1P 6K',
  'Solis single-phase low-voltage hybrid inverter, 6 kW, built around seamless generator handoff — on/off-grid switching under 10 ms, 200 % overload for 10 s to start motors or pumps, and PV input rated up to 160 % of the inverter''s own DC capacity. Battery-agnostic across 40-60 V, IP66-rated, and stackable up to six units in parallel.',
  0, null, null, true,
  '/products/solis-s6-eh1p-3-10k-l-plus.png',
  'https://www.solisinverters.com/uploads/file/S6-EH1P(3-10)K-PH-Flyer-V2,0.pdf',
  'https://www.solisinverters.com/uploads/file/Solis_Manual_S6-EH1P(3-8)K-L-PLUS_EUR_V1,3(20260402).pdf',
  array[
    '# PV input',
    'Recommended max. PV array: 12 kW',
    'Max. usable PV input power: 9.6 kW',
    'Max. input voltage: 500 V',
    'Rated voltage: 330 V',
    'Start-up voltage: 90 V',
    'MPPT voltage range: 90 - 435 V',
    'Max. input current per MPPT: 32 / 32 A',
    'Max. short circuit current per MPPT: 40 / 40 A',
    'MPPT number / max. input strings: 2 / 4',
    '# Battery',
    'Battery type: Li-ion / Lead-acid',
    'Battery voltage range: 40 - 60 V',
    'Max. charge/discharge current: 135 A',
    'Communication: CAN / RS485',
    '# AC output (grid)',
    'Rated output power: 6 kW',
    'Rated grid voltage: 220 / 230 V',
    'Rated grid frequency: 50 / 60 Hz',
    'Rated grid output current: 27.3 A (220 V) / 26.1 A (230 V)',
    'Power factor: > 0.99 (0.8 leading to 0.8 lagging)',
    'THDi: < 3 %',
    '# AC input (grid)',
    'Input voltage range: 187 - 253 V',
    'Max. input current: 40 A',
    '# AC output (backup)',
    'Rated output power: 6 kW',
    'Max. apparent output power: 2x rated power, 10 s',
    'Back-up switch time: < 10 ms',
    'Max. AC passthrough current: 40 A',
    'THDv (linear load): < 2 %',
    '# Generator input',
    'Max. input power: 6 kW',
    'Rated input frequency: 50 / 60 Hz',
    '# Efficiency',
    'Max. efficiency: 96.2 %',
    'EU efficiency: 96.1 %',
    'Battery charged by PV / AC max. efficiency: 95.3 % / 93.9 %',
    'Battery discharged to AC max. efficiency: 93.8 %',
    '# Protection',
    'Anti-islanding, ground fault monitoring, DC reverse-polarity protection: Yes',
    'Integrated AFCI 2.0: Optional',
    'Protection class / over-voltage category: I/II (PV, battery), III (mains, backup, generator)',
    '# General',
    'Dimensions (W x H x D): 335 x 560 x 253 mm',
    'Weight: 23 kg',
    'Topology: High-frequency isolation (battery side)',
    'Operating temperature range: -25 to +60 C',
    'Ingress protection: IP66',
    'Noise emission: < 65 dB(A)',
    'Max. operating altitude: 3000 m',
    'Display: 7.0" LCD + Bluetooth + app',
    'Communication interface: RS485, CAN; optional Wi-Fi, GPRS, LAN'
  ]
),
(
  'S6-EH1P 8K',
  'Solis single-phase low-voltage hybrid inverter, 8 kW, built around seamless generator handoff — on/off-grid switching under 10 ms, 200 % overload for 10 s to start motors or pumps, and PV input rated up to 160 % of the inverter''s own DC capacity. Battery-agnostic across 40-60 V, IP66-rated, and stackable up to six units in parallel.',
  0, null, null, true,
  '/products/solis-s6-eh1p-3-10k-l-plus.png',
  'https://www.solisinverters.com/uploads/file/S6-EH1P(3-10)K-PH-Flyer-V2,0.pdf',
  'https://www.solisinverters.com/uploads/file/Solis_Manual_S6-EH1P(3-8)K-L-PLUS_EUR_V1,3(20260402).pdf',
  array[
    '# PV input',
    'Recommended max. PV array: 16 kW',
    'Max. usable PV input power: 12.8 kW',
    'Max. input voltage: 500 V',
    'Rated voltage: 330 V',
    'Start-up voltage: 90 V',
    'MPPT voltage range: 90 - 435 V',
    'Max. input current per MPPT: 42 / 42 A',
    'Max. short circuit current per MPPT: 48 / 48 A',
    'MPPT number / max. input strings: 2 / 4',
    '# Battery',
    'Battery type: Li-ion / Lead-acid',
    'Battery voltage range: 40 - 60 V',
    'Max. charge/discharge current: 190 A',
    'Communication: CAN / RS485',
    '# AC output (grid)',
    'Rated output power: 8 kW',
    'Rated grid voltage: 220 / 230 V',
    'Rated grid frequency: 50 / 60 Hz',
    'Rated grid output current: 36.4 A (220 V) / 34.8 A (230 V)',
    'Power factor: > 0.99 (0.8 leading to 0.8 lagging)',
    'THDi: < 3 %',
    '# AC input (grid)',
    'Input voltage range: 187 - 253 V',
    'Max. input current: 50 A',
    '# AC output (backup)',
    'Rated output power: 8 kW',
    'Max. apparent output power: 2x rated power, 10 s',
    'Back-up switch time: < 10 ms',
    'Max. AC passthrough current: 50 A',
    'THDv (linear load): < 2 %',
    '# Generator input',
    'Max. input power: 8 kW',
    'Rated input frequency: 50 / 60 Hz',
    '# Efficiency',
    'Max. efficiency: 96.2 %',
    'EU efficiency: 96.1 %',
    'Battery charged by PV / AC max. efficiency: 95.3 % / 93.9 %',
    'Battery discharged to AC max. efficiency: 93.8 %',
    '# Protection',
    'Anti-islanding, ground fault monitoring, DC reverse-polarity protection: Yes',
    'Integrated AFCI 2.0: Optional',
    'Protection class / over-voltage category: I/II (PV, battery), III (mains, backup, generator)',
    '# General',
    'Dimensions (W x H x D): 335 x 560 x 253 mm',
    'Weight: 23.5 kg',
    'Topology: High-frequency isolation (battery side)',
    'Operating temperature range: -25 to +60 C',
    'Ingress protection: IP66',
    'Noise emission: < 65 dB(A)',
    'Max. operating altitude: 3000 m',
    'Display: 7.0" LCD + Bluetooth + app',
    'Communication interface: RS485, CAN; optional Wi-Fi, GPRS, LAN'
  ]
),
(
  'S6-EH1P 12K',
  'Solis single-phase low-voltage hybrid inverter, 12 kW, built for large residential systems that still need a generator on standby. Automatic multi-method generator connection with sub-10 ms on/off-grid switching, up to 160 % PV oversizing, and 200 % overload for 10 s to start motors or pumps. Runs on any 40-60 V battery, up to six units in parallel.',
  0, null, null, true,
  '/products/solis-s6-eh1p-12-18k-l.png',
  'https://www.solisinverters.com/uploads/file/S6-EH1P(12-18)K-PH-Flyer-V2,1.pdf',
  'https://www.solisinverters.com/uploads/file/Solis_Manual_S6-EH1P(12-18)K03-NV-YD-L_EUR_V1,3(20251030).pdf',
  array[
    '# PV input',
    'Recommended max. PV array: 24 kW',
    'Max. usable PV input power: 19.2 kW',
    'Max. input voltage: 550 V',
    'Rated voltage: 380 V',
    'Start-up voltage: 100 V',
    'MPPT voltage range: 80 - 520 V',
    'MPPT number / max. input strings: 3 / 6',
    'Max. PV input current: 40 A (20 A per DC input)',
    'Max. short circuit current: 50 A / 50 A / 50 A',
    '# Battery',
    'Battery type: Li-ion / Lead-acid',
    'Battery voltage range: 40 - 60 V',
    'Max. charge/discharge current: 250 A',
    'Battery ports / BMS ports: 1 / 1',
    'Communication: CAN / RS485',
    '# AC output (grid side)',
    'Rated output power: 12 kW',
    'Rated grid voltage: L/N/PE, 220 / 230 V',
    'Rated grid frequency: 50 / 60 Hz',
    'Rated output current: 54.5 A',
    'Max. input AC power: 18 kW',
    'Power factor: > 0.99 (0.8 leading to 0.8 lagging)',
    'THDi: < 3 %',
    '# AC output (backup)',
    'Rated backup output current: 52.2 A',
    'Max. apparent output power: 2x rated power, 10 s',
    'Back-up switch time: < 10 ms (single unit), < 20 ms (up to 6 in parallel)',
    'Max. AC passthrough current: 90 A',
    'THDv: < 3 %',
    '# Generator input',
    'Rated input power: 12 kW',
    '# Efficiency',
    'Max. efficiency: 97.6 %',
    'EU efficiency: 97.0 %',
    'Battery charge efficiency (PV / AC): > 94.9 % / > 94.33 %',
    'Battery discharge efficiency: 93.51 %',
    '# Protection',
    'Integrated protections: surge, output overcurrent, insulation resistance monitoring, residual current detection, integrated PV switch',
    'DC reverse-polarity protection: Yes (PV only)',
    'Protection class / over-voltage category: I/II (PV, battery), III (mains, backup, generator)',
    'Integrated AFCI 2.0: Optional',
    'Anti-islanding protection: Yes',
    '# General',
    'Dimensions (W x H x D): 459 x 845 x 313 mm',
    'Weight: 55.5 kg',
    'Topology: Non-isolated (PV), isolated (battery)',
    'Self-consumption: < 40 W',
    'Operating temperature range: -25 to +60 C',
    'Relative humidity: 0 - 100 %',
    'Ingress protection: IP66',
    'Noise emission: < 65 dB(A)',
    'Cooling: Intelligent redundant fan-cooling',
    'Max. operating altitude: 4000 m',
    'Display: 7.0" LCD + Bluetooth + app',
    'Communication interface: WiFi + LAN + Bluetooth, CAN-BMS, CAN-Parallel x2, RS485-Meter, RS485, DRM, DI, DOx2 (4G optional)'
  ]
),
(
  'S6-EH1P 16K',
  'Solis single-phase low-voltage hybrid inverter, 16 kW, built for large residential systems that still need a generator on standby. Automatic multi-method generator connection with sub-10 ms on/off-grid switching, up to 160 % PV oversizing, and 200 % overload for 10 s to start motors or pumps. Runs on any 40-60 V battery, up to six units in parallel.',
  0, null, null, true,
  '/products/solis-s6-eh1p-12-18k-l.png',
  'https://www.solisinverters.com/uploads/file/S6-EH1P(12-18)K-PH-Flyer-V2,1.pdf',
  'https://www.solisinverters.com/uploads/file/Solis_Manual_S6-EH1P(12-18)K03-NV-YD-L_EUR_V1,3(20251030).pdf',
  array[
    '# PV input',
    'Recommended max. PV array: 32 kW',
    'Max. usable PV input power: 25.6 kW',
    'Max. input voltage: 550 V',
    'Rated voltage: 380 V',
    'Start-up voltage: 100 V',
    'MPPT voltage range: 80 - 520 V',
    'MPPT number / max. input strings: 3 / 6',
    'Max. PV input current: 40 A (20 A per DC input)',
    'Max. short circuit current: 50 A / 50 A / 50 A',
    '# Battery',
    'Battery type: Li-ion / Lead-acid',
    'Battery voltage range: 40 - 60 V',
    'Max. charge/discharge current: 290 A',
    'Battery ports / BMS ports: 1 / 1',
    'Communication: CAN / RS485',
    '# AC output (grid side)',
    'Rated output power: 16 kW',
    'Rated grid voltage: L/N/PE, 220 / 230 V',
    'Rated grid frequency: 50 / 60 Hz',
    'Rated output current: 72.7 A',
    'Max. input AC power: 24 kW',
    'Power factor: > 0.99 (0.8 leading to 0.8 lagging)',
    'THDi: < 3 %',
    '# AC output (backup)',
    'Rated backup output current: 69.6 A',
    'Max. apparent output power: 2x rated power, 10 s',
    'Back-up switch time: < 10 ms (single unit), < 20 ms (up to 6 in parallel)',
    'Max. AC passthrough current: 90 A',
    'THDv: < 3 %',
    '# Generator input',
    'Rated input power: 16 kW',
    '# Efficiency',
    'Max. efficiency: 97.6 %',
    'EU efficiency: 97.0 %',
    'Battery charge efficiency (PV / AC): > 94.9 % / > 94.33 %',
    'Battery discharge efficiency: 93.51 %',
    '# Protection',
    'Integrated protections: surge, output overcurrent, insulation resistance monitoring, residual current detection, integrated PV switch',
    'DC reverse-polarity protection: Yes (PV only)',
    'Protection class / over-voltage category: I/II (PV, battery), III (mains, backup, generator)',
    'Integrated AFCI 2.0: Optional',
    'Anti-islanding protection: Yes',
    '# General',
    'Dimensions (W x H x D): 459 x 845 x 313 mm',
    'Weight: 55.5 kg',
    'Topology: Non-isolated (PV), isolated (battery)',
    'Self-consumption: < 40 W',
    'Operating temperature range: -25 to +60 C',
    'Relative humidity: 0 - 100 %',
    'Ingress protection: IP66',
    'Noise emission: < 65 dB(A)',
    'Cooling: Intelligent redundant fan-cooling',
    'Max. operating altitude: 4000 m',
    'Display: 7.0" LCD + Bluetooth + app',
    'Communication interface: WiFi + LAN + Bluetooth, CAN-BMS, CAN-Parallel x2, RS485-Meter, RS485, DRM, DI, DOx2 (4G optional)'
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
-- 4. GOODWE ES UNIQ — LOW-VOLTAGE HYBRID INVERTER
--
--    6 kW and 12 kW only, off the one ES Uniq datasheet that covers the
--    whole 3-12 kW range.
-- ---------------------------------------------------------------------------

insert into public.products
  (name, description, retail_price, installer_price, stock_quantity, is_active,
   image_url, datasheet_url, manual_url, specifications)
values

(
  'GW6000-ES-C10',
  'GoodWe single-phase low-voltage hybrid inverter, 6 kW, for residential PV that needs both on-grid and off-grid operation from one connection point. A generator port and smart-load control sit alongside the on-grid inverter itself, up to six units run in parallel for larger systems, and the enclosure is IP66-rated for outdoor mounting.',
  0, null, null, true,
  '/products/goodwe-es-uniq.png',
  'https://en.goodwe.com/Skippower/downloadFileF?id=2373&mid=60',
  null,
  array[
    '# Battery input',
    'Battery type: Li-ion / Lead-acid',
    'Nominal battery voltage: 48 V',
    'Battery voltage range: 40 - 60 V',
    'Start-up voltage: 44.2 V',
    'Max. continuous charging current: 140 A',
    'Max. continuous discharging current: 140 A',
    'Max. charging power: 6.0 kW',
    'Max. discharging power: 6.6 kW',
    '# PV string input',
    'Max. input power: 12.0 kW',
    'Max. input voltage: 600 V',
    'MPPT operating voltage range: 60 - 550 V',
    'Start-up voltage: 58 V',
    'Nominal input voltage: 360 V',
    'Max. input current per MPPT: 20 A',
    'Max. short-circuit current per MPPT: 26 A',
    'Number of MPPT trackers: 2',
    'Number of strings per MPPT: 1',
    '# AC output (on-grid)',
    'Nominal output power: 6.0 kW',
    'Max. AC active power: 6.6 kW',
    'Max. apparent power from utility grid: 8.8 kVA',
    'Nominal output voltage: 220 / 230 / 240 V',
    'Output voltage range: 170 - 280 V',
    'Nominal AC grid frequency: 50 / 60 Hz',
    'Max. AC current output to utility grid: 30 A',
    'Max. AC current from utility grid: 40 A',
    'Power factor: ~1, adjustable 0.8 leading to 0.8 lagging',
    'Max. total harmonic distortion: < 3 %',
    '# AC output (backup)',
    'Back-up nominal apparent power: 6.0 kVA',
    'Max. output apparent power without grid, 10 s surge: 12.0 kVA',
    'Max. output current without grid: 30 A',
    'Nominal output voltage: 220 / 230 / 240 V',
    'Nominal output frequency: 50 / 60 Hz',
    '# Generator input',
    'Nominal apparent power from AC generator: 6.0 kVA',
    'Max. AC current from AC generator: 40.0 A',
    '# Efficiency',
    'Max. efficiency: 97.6 %',
    'European efficiency: 96.2 %',
    'Max. battery-to-AC efficiency: 95.5 %',
    'MPPT efficiency: 99.9 %',
    '# Protection',
    'Integrated protections: PV string current monitoring, PV insulation resistance detection, residual current monitoring, PV reverse polarity, anti-islanding, AC overcurrent, AC short circuit, AC overvoltage, DC switch, remote shutdown',
    'DC surge protection: Type III',
    'AC surge protection: Type III',
    'AFCI: Optional',
    'Rapid shutdown: Optional',
    '# General',
    'Operating temperature range: -35 to +60 C',
    'Relative humidity: 0 - 95 %',
    'Max. operating altitude: 3000 m',
    'Cooling method: Natural convection',
    'Display & communication: LCD, WLAN + app, RS485, WiFi + LAN + Bluetooth, CAN (BMS), Modbus-RTU/TCP',
    'Weight: 15.5 kg',
    'Dimensions (W x H x D): 560 x 415 x 204 mm',
    'Topology: Non-isolated',
    'Ingress protection: IP66',
    'Mounting: Wall mounted'
  ]
),
(
  'GW12K-ES-C10',
  'GoodWe single-phase low-voltage hybrid inverter, 12 kW, for residential PV that needs both on-grid and off-grid operation from one connection point. A generator port and smart-load control sit alongside the on-grid inverter itself, up to six units run in parallel for larger systems, and the enclosure is IP66-rated for outdoor mounting.',
  0, null, null, true,
  '/products/goodwe-es-uniq.png',
  'https://en.goodwe.com/Skippower/downloadFileF?id=2373&mid=60',
  null,
  array[
    '# Battery input',
    'Battery type: Li-ion / Lead-acid',
    'Nominal battery voltage: 48 V',
    'Battery voltage range: 40 - 60 V',
    'Start-up voltage: 44.2 V',
    'Max. continuous charging current: 240 A',
    'Max. continuous discharging current: 240 A',
    'Max. charging power: 12.0 kW',
    'Max. discharging power: 13.2 kW',
    '# PV string input',
    'Max. input power: 24.0 kW',
    'Max. input voltage: 600 V',
    'MPPT operating voltage range: 60 - 550 V',
    'Start-up voltage: 58 V',
    'Nominal input voltage: 360 V',
    'Max. input current per MPPT: 32 + 32 A',
    'Max. short-circuit current per MPPT: 48 + 48 A',
    'Number of MPPT trackers: 2',
    'Number of strings per MPPT: 2 + 2',
    '# AC output (on-grid)',
    'Nominal output power: 12.0 kW',
    'Max. AC active power: 13.2 kW',
    'Max. apparent power from utility grid: 16.5 kVA',
    'Nominal output voltage: 220 / 230 / 240 V',
    'Output voltage range: 170 - 280 V',
    'Nominal AC grid frequency: 50 / 60 Hz',
    'Max. AC current output to utility grid: 60 A',
    'Max. AC current from utility grid: 75 A',
    'Power factor: ~1, adjustable 0.8 leading to 0.8 lagging',
    'Max. total harmonic distortion: < 3 %',
    '# AC output (backup)',
    'Back-up nominal apparent power: 12.0 kVA',
    'Max. output apparent power without grid, 10 s surge: 24.0 kVA',
    'Max. output current without grid: 60 A',
    'Nominal output voltage: 220 / 230 / 240 V',
    'Nominal output frequency: 50 / 60 Hz',
    '# Generator input',
    'Nominal apparent power from AC generator: 12.0 kVA',
    'Max. AC current from AC generator: 54.5 A',
    '# Efficiency',
    'Max. efficiency: 97.6 %',
    'European efficiency: 96.2 %',
    'Max. battery-to-AC efficiency: 95.5 %',
    'MPPT efficiency: 99.9 %',
    '# Protection',
    'Integrated protections: PV string current monitoring, PV insulation resistance detection, residual current monitoring, PV reverse polarity, anti-islanding, AC overcurrent, AC short circuit, AC overvoltage, DC switch, remote shutdown',
    'DC surge protection: Type III',
    'AC surge protection: Type III',
    'AFCI: Optional',
    'Rapid shutdown: Optional',
    '# General',
    'Operating temperature range: -35 to +60 C',
    'Relative humidity: 0 - 95 %',
    'Max. operating altitude: 3000 m',
    'Cooling method: Smart fan cooling',
    'Display & communication: LCD, WLAN + app, RS485, WiFi + LAN + Bluetooth, CAN (BMS), Modbus-RTU/TCP',
    'Weight: 29.0 kg',
    'Dimensions (W x H x D): 560 x 444.5 x 226 mm',
    'Topology: Non-isolated',
    'Ingress protection: IP66',
    'Mounting: Wall mounted'
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
--    Same reasoning as the HYXiPOWER seed: the shop's filter bar runs
--    entirely off these two columns, so a row left unset is invisible to
--    every filter regardless of how complete its specification is.
-- ---------------------------------------------------------------------------
update public.products set category = 'inverter', voltage_class = 'low'
 where name in (
   'GEN2-LB-EU 6K', 'GEN2-LB-EU 10K', 'GEN2-LB-EU 12K',
   'S6-EH1P 6K', 'S6-EH1P 8K', 'S6-EH1P 12K', 'S6-EH1P 16K',
   'GW6000-ES-C10', 'GW12K-ES-C10'
 );

update public.products set category = 'battery', voltage_class = 'low'
 where name in ('T-BAT-SYS-LV D150');

commit;

-- ---------------------------------------------------------------------------
-- Check. Ten rows, every one active, priced 0, with a specification and a
-- datasheet link, waiting on the back office for a real peso figure.
-- ---------------------------------------------------------------------------
select name,
       category,
       voltage_class,
       retail_price,
       stock_quantity,
       array_length(specifications, 1) as spec_lines,
       (datasheet_url is not null)     as has_datasheet,
       (manual_url is not null)        as has_manual
  from public.products
 where name in (
   'GEN2-LB-EU 6K', 'GEN2-LB-EU 10K', 'GEN2-LB-EU 12K',
   'T-BAT-SYS-LV D150',
   'S6-EH1P 6K', 'S6-EH1P 8K', 'S6-EH1P 12K', 'S6-EH1P 16K',
   'GW6000-ES-C10', 'GW12K-ES-C10'
 )
 order by category, voltage_class, name;
