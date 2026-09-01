# VIP Solar

Marketing site and partner-registration front end for VIP Solar — grid-tie, hybrid
and storage inverters, plus the installer program sign-up.

## Stack

| | |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 |
| Styles | Tailwind CSS v4 via `@tailwindcss/postcss`, tokens declared in `@theme` |
| Fonts | `next/font/google` — Space Grotesk (display), Inter (body), JetBrains Mono (spec data) |

No component library and no icon package — the icon set and the inverter
illustration are both hand-drawn SVG in `src/components`. There are no image
assets at all.

## Getting started

Requires Node 20+.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

## Layout

```
src/
  app/
    layout.jsx             fonts, metadata, <html>/<body>
    page.jsx               page composition + skip link
    globals.css            design tokens (@theme) and custom utilities
    icon.svg               favicon, picked up by the App Router
  components/
    Nav.jsx                sticky header, transparent over the hero   [client]
    Hero.jsx               headline, CTAs, spec rail
    InverterArt.jsx        vector product render (no image assets)
    Products.jsx           four product families
    WhyVip.jsx             differentiators + numbers band
    InstallerProgram.jsx   tiers and the "have these ready" prompt
    Registration.jsx       account form + installer verification     [client]
    Footer.jsx             sitemap and contact
    form.jsx               Field / TextInput / Select / Checkbox      [client]
    ui.jsx                 Button, Eyebrow, SectionHeading, SpecChip, Section
    icons.jsx              shared single-weight icon set
```

Everything is a server component except the three marked `[client]` — only the
nav (scroll state, mobile sheet) and the registration form (state, validation,
file handling) need to run in the browser.

`@/*` maps to `./src/*` via `jsconfig.json`.

## Design notes

The reference brief was the corporate-technical look of established inverter
manufacturers, deliberately pushed away from the usual white-and-blue template:

- **Instrument-panel navy** base (`--color-ink-*`) with **solar amber** as the
  energy accent and **electric blue** for signal/links.
- **Blueprint grid** and radial blooms behind the hero and CTA bands.
- **Bevelled corners** (`clip-bevel`) instead of a plain border radius, so cards
  read as machined hardware rather than generic panels.
- **Monospace for all technical data** — ratings, efficiency, licence numbers.
- **Numbered section eyebrows** (`01 /`, `02 /`) borrowed from engineering drawings.

Because fonts come from `next/font`, the family names are hashed at build time —
SVG text inside `InverterArt.jsx` therefore references
`var(--font-jetbrains)` rather than a literal family name.

## Registration behaviour

The form is the functional core of the page:

- Name and company are captured for every account. Company is optional for
  homeowners and becomes **required** once the installer box is ticked.
- An **installer checkbox** carries an explicit note that it should only be
  ticked by professional PV installers.
- Ticking it reveals a **trade-verification panel**: business registration
  number, contractor licence number and expiry, years installing, install
  volume, service area, certifications, and a **supporting-documents upload**.
- The dropzone accepts PDF/JPG/PNG/WEBP/DOC/DOCX, max 50 MB per file and 8 files
  total, de-duplicates on name+size, and reports per-file rejection reasons. The
  server action re-checks both the type and the size — see MAX_DOC_BYTES and
  DOC_TYPES in app/actions/verification.js.
- Validation is submit-time, moves focus to the first invalid control, and the
  installer rules only apply when the box is ticked.

## Status

Front end only. Submitting runs client-side validation and renders the success
state — there is no API call yet, and uploaded files never leave the browser.
Wiring the route handler, real authentication and document storage is the next
piece of work.
