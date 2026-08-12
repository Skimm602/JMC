import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import './globals.css'

/**
 * Archivo carries a width axis, which is the whole reason it is here: the
 * display voice is set expanded and tight-tracked so headings read like
 * stamping on an equipment nameplate rather than a marketing headline.
 */
const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
})

/**
 * Plex Sans and Plex Mono share skeletons, so a spec table and the prose
 * around it read as one document instead of two typefaces in a trenchcoat.
 */
const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-sans',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export const metadata = {
  title: 'VIP Solar — Inverters & Energy Storage',
  description:
    'VIP Solar engineers grid-tie, hybrid and storage inverters for residential and commercial solar. Join the certified installer program.',
  openGraph: {
    title: 'VIP Solar — Inverters & Energy Storage',
    description: 'Grid-tie, hybrid and storage inverters engineered for thermal headroom and clean commissioning.',
    type: 'website',
  },
}

export const viewport = {
  themeColor: '#0d2949',
}

/**
 * Everything shared by every document and nothing else: the fonts, the sheet
 * the palette is built on, and the two elements a layout is not allowed to
 * skip. The public site's header and footer moved down into `(site)`, because
 * /admin is not the public site — it is a back office that happens to be
 * served from the same origin, and it has no business wearing the marketing
 * chrome or linking back into it.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable} scroll-smooth`}>
      <body>{children}</body>
    </html>
  )
}
