import SectionIndex from '@/components/SectionIndex.jsx'
import Hero from '@/components/Hero.jsx'
import Products from '@/components/Products.jsx'
import Sizing from '@/components/Sizing.jsx'
import WhyVip from '@/components/WhyVip.jsx'
import InstallerProgram from '@/components/InstallerProgram.jsx'
import About from '@/components/About.jsx'

/**
 * Registration is its own route now, so the page ends on who the company is
 * rather than on a form: About closes the argument the hero opens, and the
 * call to register is a link out of it from every band that earns one.
 */
export default function Home() {
  return (
    <>
      <SectionIndex />

      <main id="content">
        <Hero />
        <Products />
        <Sizing />
        <WhyVip />
        <InstallerProgram />
        <About />
      </main>
    </>
  )
}
