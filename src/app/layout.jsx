import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata = {
  title: 'JMC Solar — Inverters & Energy Storage',
  description:
    'JMC Solar engineers grid-tie, hybrid and storage inverters for residential and commercial solar. Join the certified installer program.',
  openGraph: {
    title: 'JMC Solar — Inverters & Energy Storage',
    description:
      'Grid-tie, hybrid and storage inverters engineered for thermal headroom and clean commissioning.',
    type: 'website',
  },
}

export const viewport = {
  themeColor: '#070E1B',
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrains.variable} scroll-smooth`}
    >
      <body>{children}</body>
    </html>
  )
}
