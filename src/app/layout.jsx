import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import Nav from '@/components/Nav.jsx'
import Footer from '@/components/Footer.jsx'
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

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable} scroll-smooth`}>
      {/* The bar and the footer belong to every route now that registration
          has one of its own, so they live here rather than being composed into
          each page and drifting apart. The skip link lands on the page's own
          content, which is the only thing that differs between them. */}
      <body>
        <a
          href="#content"
          className="focus:bg-cool-600 focus:text-glare sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
        >
          Skip to content
        </a>

        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  )
}
