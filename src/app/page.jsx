import Nav from '@/components/Nav.jsx'
import SectionIndex from '@/components/SectionIndex.jsx'
import Hero from '@/components/Hero.jsx'
import Products from '@/components/Products.jsx'
import WhyJmc from '@/components/WhyJmc.jsx'
import InstallerProgram from '@/components/InstallerProgram.jsx'
import Registration from '@/components/Registration.jsx'
import Footer from '@/components/Footer.jsx'

export default function Home() {
  return (
    <>
      <a
        href="#register"
        className="focus:bg-solar-500 focus:text-ink-950 sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
      >
        Skip to registration
      </a>

      <Nav />
      <SectionIndex />

      <main>
        <Hero />
        <Products />
        <WhyJmc />
        <InstallerProgram />
        <Registration />
      </main>

      <Footer />
    </>
  )
}
