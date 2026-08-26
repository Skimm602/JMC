# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, deliberately weighted the same. The user was asked which to put
first and declined to choose: whoever arrives, the site has to land hard.

- **Installers and contractors.** Electricians and solar installers specifying
  and buying equipment for a client's roof. They arrive knowing model numbers,
  want the specification, the stock position and a trade figure, and are
  comparing against a supplier they already use.
- **Homeowners and businesses.** People buying a system for their own roof.
  They arrive without the vocabulary, need to understand what an inverter and
  a battery actually do for them, and are deciding whether this company can be
  trusted with a large purchase and a warranty that outlives the sale.

## Product Purpose

VIP Solar sells hybrid solar inverters and LiFePO₄ battery storage in the
Philippines, and runs a verified installer partner programme alongside the
public catalogue. The site is both the catalogue and the trade counter: it
carries the full technical specification for every unit, takes retail orders,
and is where an installer applies for a trade account.

Success is a visitor who either places an order, applies for an installer
account, or rings the trade desk for a quote.

## Positioning

The claim the site makes, and the one the engineering copy is built around, is
thermal honesty: datasheets are written at 25 °C ambient, and a Philippine roof
enclosure sits past 40 °C by mid-afternoon. Equipment is specified to hold its
rated output at that temperature rather than at a laboratory figure nobody
installs into.

The second position is service: the company services what it sells, and the
installer programme carries advance-replacement RMA so a customer is not left
without power while a claim is assessed.

## Operating Context

- Buyers are in the Philippines. Prices are in pesos, VAT is Philippine VAT,
  and payment methods are local (GCash, QR Ph, PesoNet).
- Roof temperature, salt air and unstable grid are the real operating
  conditions the equipment is sold against.
- The trade desk is reachable by phone and is currently how every price is
  settled — no product on the site carries a published figure yet.
- Installers arrive with business registration, a contractor licence and proof
  of insurance to be verified before trade pricing applies.

## Capabilities and Constraints

**Catalogue.** 17 active products across two types: hybrid inverters
(HYXiPOWER, LuxpowerTek, Solis, GoodWe) and LiFePO₄ batteries (HYXiPOWER,
SolaX). A third type, accessories, exists in the data model and the navigation
but is not yet stocked. Every product carries a transcribed specification table
and links to the manufacturer's own datasheet and user manual as PDFs.

**Pricing.** All prices are VAT-exclusive; 12% VAT is added at checkout and the
order summary shows subtotal, VAT and total separately. Installer accounts see
a trade price with the list price struck through beside it. **Every one of the
17 products currently shows "Price on request"** — no peso figure has been set,
so the storefront copy and the price filter are written to read that state off
the catalogue rather than assume it.

**Ordering.** Payment by GCash, QR Ph or PesoNet, chosen before the order is
placed. Delivery is arranged after payment clears. **No refunds** once an order
is placed; the checkout requires a tickbox confirming both the exact amount and
the no-refund rule. Multi-unit, commercial and installation-inclusive jobs are
quoted by the trade desk rather than ordered through the site.

**Installer programme.** Trade pricing plus advance-replacement RMA.
Verification is a manual review of business registration, contractor licence
and proof of insurance, all current and in the account company's name. Uploaded
documents are used only for verification, never shown to other customers, never
marketed or sold, and deleted twelve months after the licence they show
expires.

**Warranty.** Ten years on inverters, five on accessories, counted from
dispatch rather than installation. Cover depends on installation by a qualified
electrician per the manual and on the unit staying inside its published
operating envelope.

**Technical.** Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4
with a custom `@theme` token set in `src/app/globals.css`. Supabase for auth,
catalogue, orders and document storage, with row-level security. Resend for
outbound email. A shopping assistant running on Google Gemini 2.5 Flash.
Deployment is a manual `vercel --prod --scope cymon-trillana-s-projects`;
pushing to GitHub does not deploy.

## Brand Commitments

- Name: **VIP Solar** (renamed from JMC in August 2026; the repository and
  local directory are still `JMC`, and the support address is still
  `jmcsolarph@gmail.com`).
- Wordmark is set as type — "Vip Solar" with a coloured full stop — rather than
  a drawn logo.
- Voice throughout the existing copy is plain, technical and unhedged: it
  states rules rather than softening them ("No. There are no refunds once an
  order is placed"). Future copy should not drift into marketing warmth that
  the checkout then contradicts.

## Evidence on Hand

All of the following is real, taken from the company's live site at
jmcsolarph.com (the same business under its former JMC Solar PH name) and
recorded in `src/utils/company.js`. Nothing on this site may restate a company
fact in its own markup.

- **Address:** Lilia Avenue, Cogon, Ormoc City, Leyte 6541. Hours Mon–Fri
  8:00am–5:00pm.
- **Contact:** 0917 508 8220, 0949 954 8439, (053) 520-2459;
  jmcsolarph@gmail.com; Facebook page with 3,300+ followers.
- **Published figures:** 100% recommend rate, 9+ completed projects, system
  capacities from 6 kW to 1 MW, 3.3K+ following.
- **Credentials:** DOE and ERC compliant installations; every install led by a
  duly licensed electrical engineer; authorised multi-brand dealer.
- **Partner brands (17):** HYXiPOWER, Solis, GoodWe, SolaX, Deye, Sofar, Jinko,
  Trina, REC, Livoltek, LVTOPSUN, SRNE, Sunri, Aiko, Voltronic, Think Power,
  Japan Solar.
- **Services:** hybrid systems, on-grid/net-metered, BESS, solar pumping, EV
  charger installation, operation and maintenance.
- **Service areas:** Leyte (8 municipalities), Southern Leyte (3), Cebu (8).
- **Testimonials:** seven real reviews, quoted verbatim including the Bisaya
  and the typing. Two carry customer-stated results — "My bill was 10k before
  the solar now im paying 2k only" and a farm that dropped diesel irrigation.
- **Photography:** 17 product shots in `public/products/`; one real rooftop
  install photo in git history at `68f57a6`; a sunset array at
  `public/about-sunset.jpg` (418×733, must not be enlarged).

**Still not established — must not be fabricated:** founding year, number of
staff, total installed capacity, any award or certification beyond DOE/ERC
compliance, and any published peso price for catalogue equipment.

**Superseded:** the founding year, "four product families", "more than forty
countries" and "two point four gigawatts shipped" that previously appeared in
`About.jsx` were PLACEHOLDER example text and are false. They have been
replaced by the record above and must never return.

## Product Principles

1. **The site must not claim more than the company can keep.** Copy that the
   checkout, the catalogue or the warranty then contradicts costs more than
   plain language would have.
2. **State the technical truth, then make it land.** The thermal argument is
   the differentiator; it should be felt, not just read.
3. **Both audiences on one page.** An installer scanning for a model number and
   a homeowner learning what a hybrid inverter is have to be served by the same
   surfaces without either being condescended to or lost.
4. **Read the catalogue, do not assume it.** Prices, stock, brands and types
   are data. Anything the design says about them has to degrade correctly when
   the data is empty or unpriced.
5. **A quote is a phone call.** Until prices are published, the trade desk
   number is a primary call to action, not fine print.
6. **The site's job is to sell.** The user's instruction is explicit: hard
   sell, selling is the sole focus. Every surface carries a visible primary
   action, the strongest real proof leads rather than waits below the fold,
   and no band exists purely to be admired. The constraint on this is
   principle 1, not politeness: the hard sell runs on the real numbers the
   customers themselves stated, never on invented ones.

## Accessibility & Inclusion

No externally mandated standard was established. The existing codebase shows a
deliberate accessibility practice that future work must not regress: skip link,
`aria-current` on active navigation, `inert` on the collapsed mobile sheet,
keyboard traversal of menus with Escape returning focus to the trigger, real
alt text, and a token comment tracking a 4.5:1 contrast shortfall on
`--color-ink-soft`.
