/**
 * The company, as it actually is.
 *
 * Every fact here is taken from the live company site at jmcsolarph.com —
 * the same business, trading as JMC Solar PH / JMC Power before the VIP Solar
 * name. Nothing in this file is illustrative and nothing may be rounded up to
 * make a section look fuller: the About band on this site previously carried
 * an invented founding year, an invented country count and an invented
 * gigawatt figure, all marked PLACEHOLDER in the source and all of it visible
 * to customers. That is the failure this file exists to prevent.
 *
 * If a number here needs to change, change it here. Nothing should restate a
 * company fact in its own JSX.
 */

export const COMPANY = {
  name: 'Vip Solar',
  formerName: 'JMC Solar PH',
  alsoKnownAs: 'JMC Power',
  tagline: 'Future is Sustainable Electric',
  address: {
    street: 'Lilia Avenue, Cogon',
    city: 'Ormoc City',
    province: 'Leyte',
    postcode: '6541',
    country: 'Philippines',
  },
  phones: ['0917 508 8220', '0949 954 8439', '(053) 520-2459'],
  email: 'jmcsolarph@gmail.com',
  facebook: 'https://www.facebook.com/jmcsolarph',
  hours: 'Monday to Friday, 8:00am – 5:00pm',
}

/** One line, for a footer or a schema block. */
export const ADDRESS_LINE = `${COMPANY.address.street}, ${COMPANY.address.city}, ${COMPANY.address.province} ${COMPANY.address.postcode}`

/**
 * The four figures the company actually publishes.
 *
 * `note` is what makes each one mean something: "9+" on its own is a number,
 * "9+ completed installations" is a claim, and "the smallest is a 6 kW roof,
 * the largest a megawatt" is the thing a customer can picture.
 */
export const STATS = [
  {
    figure: '100%',
    label: 'Recommend rate',
    note: 'Across every review left on our page.',
  },
  {
    figure: '6 kW – 1 MW',
    label: 'System capacities',
    note: 'From a single household roof to industrial plant.',
  },
  {
    figure: '9+',
    label: 'Completed projects',
    note: 'Commissioned, energised and handed over.',
  },
  {
    figure: '3.3K+',
    label: 'Following',
    note: 'People watching the work on Facebook.',
  },
]

/**
 * The credentials that decide whether a roof job is legal and insurable, which
 * is a different question from whether the equipment is good.
 */
export const CREDENTIALS = [
  {
    title: 'DOE and ERC compliant',
    body: 'Installations meet Department of Energy and Energy Regulatory Commission requirements, which is what makes net metering possible at all.',
  },
  {
    title: 'Led by a licensed electrical engineer',
    body: 'Every installation is carried out under a duly licensed electrical engineer with a professionally trained crew — not a subcontracted team you meet on the day.',
  },
  {
    title: 'Authorised multi-brand dealer',
    body: 'We are a certified dealer for the manufacturers we install, so warranty claims go through us rather than leaving you to argue with an importer.',
  },
]

/**
 * The manufacturers actually carried. Ordered with the two we stock as boxed
 * equipment on this site first, because those are the ones a visitor can click
 * through to a specification.
 */
export const PARTNER_BRANDS = [
  'HYXiPOWER',
  'Solis',
  'GoodWe',
  'SolaX Power',
  'Deye',
  'Sofar Solar',
  'Jinko Solar',
  'Trina Solar',
  'REC Group',
  'Livoltek',
  'LVTOPSUN',
  'SRNE Solar',
  'Sunri',
  'Aiko',
  'Voltronic Power',
  'Think Power',
  'Japan Solar',
]

/** What the company does on a roof, as distinct from what it sells in a box. */
export const SERVICES = [
  { title: 'Hybrid solar systems', body: 'Panels, inverter and battery, so the house rides through a brownout instead of going dark with everyone else.' },
  { title: 'On-grid and net-metered', body: 'Grid-tied systems registered for net metering, so daytime surplus runs your meter backwards.' },
  { title: 'Battery energy storage', body: 'Standalone BESS for sites that already have generation and need to move it to another time of day.' },
  { title: 'Solar pumping', body: 'Irrigation off the sun rather than off diesel — the running cost goes to zero after commissioning.' },
  { title: 'EV charger installation', body: 'Charge points sized against the existing service, and against the solar if there is any.' },
  { title: 'Operation and maintenance', body: 'Monitoring, cleaning and fault attendance for systems we installed and systems we did not.' },
]

/**
 * Where crews actually travel. Grouped by province because that is how a
 * customer checks whether they are covered.
 */
export const SERVICE_AREAS = [
  { province: 'Leyte', places: ['Ormoc City', 'Tacloban City', 'Baybay City', 'Inopacan', 'Hindang', 'Hilongos', 'Bato', 'Matalom'] },
  { province: 'Southern Leyte', places: ['Maasin City', 'Macrohon', 'Sogod'] },
  { province: 'Cebu', places: ['Cebu City', 'Mandaue City', 'Talisay City', 'Liloan', 'Consolacion', 'Danao City', 'Carcar City', 'Minglanilla'] },
]

/**
 * Real reviews, quoted as written — including the Bisaya and the typing. A
 * testimonial tidied into corporate English stops sounding like a person and
 * starts sounding like copy, which is the opposite of what it is for.
 *
 * `result` is pulled out only where the reviewer stated a number themselves.
 */
export const TESTIMONIALS = [
  {
    quote: 'My bill was 10k before the solar now im paying 2k only.. Im very happy with the results and aftersales support is excellent.',
    result: '₱10k → ₱2k',
    attribution: 'Homeowner',
  },
  {
    quote: 'Sa JMC wala nay brownout ky naka solar naman ka.',
    attribution: 'Customer, Ormoc',
  },
  {
    quote: 'Our electricity bill dropped significantly after JMC installed our solar system. Best investment we have made for our business.',
    attribution: 'Business owner',
  },
  {
    quote: 'The solar pump system JMC installed for our farm has been running perfectly. No more diesel expenses for irrigation!',
    attribution: 'Farm owner',
  },
  {
    quote: 'The owner and workers were approachable and know the best what they installed.',
    attribution: 'JES Chu',
  },
  {
    quote: 'Very professional team. From consultation to installation, they guided us through every step. Highly recommend!',
    attribution: 'Homeowner',
  },
  {
    quote: 'if you want to save a lot in terms of electricity bill. this company will definitely help you! quality of their products should be more than just 5 star in rate.',
    attribution: 'Customer',
  },
]

/**
 * The company's own account of itself, at the length a visitor will actually
 * read. Replaces the PLACEHOLDER story that used to sit in About.jsx.
 */
export const STORY = [
  'Vip Solar — trading as JMC Solar PH, and known around Ormoc as JMC Power — is a renewable energy company working out of Lilia Avenue in Cogon, Ormoc City. We design, supply and install solar across Leyte, Southern Leyte and Cebu.',
  'The work runs from a single 6 kW household roof up to megawatt-scale industrial plant, and every installation is carried out under a duly licensed electrical engineer to DOE and ERC standards. That is not a formality: it is what makes a system insurable, and what makes net metering possible.',
  'We are an authorised dealer for the manufacturers we install, which means a warranty claim comes back to us rather than to an importer who has never seen your roof. The equipment on this site is the same equipment our own crews put up.',
]
