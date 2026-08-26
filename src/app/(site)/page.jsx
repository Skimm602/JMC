import SectionIndex from '@/components/SectionIndex.jsx'
import Hero from '@/components/Hero.jsx'
import Proof from '@/components/Proof.jsx'
import ProductCategories from '@/components/ProductCategories.jsx'
import WhyChooseVip from '@/components/WhyChooseVip.jsx'
import About from '@/components/About.jsx'

/**
 * Registration is its own route now, so the page ends on who the company is
 * rather than on a form: About closes the argument the hero opens, and the
 * call to register is a link out of it from every band that earns one.
 *
 * The detailed spec-comparison range, the sizing calculator, the
 * installer-tier table and the engineering-arguments section are no longer
 * on this page — kept as components (`Products.jsx`, `Sizing.jsx`,
 * `InstallerProgram.jsx`, `WhyVip.jsx`) but unmounted here in favour of a
 * shorter, category-led front page. `/products` remains the full priced
 * catalogue.
 */
export default function Home() {
  return (
    <>
      <SectionIndex />

      <main id="content">
        <Hero />
        <Proof />
        <ProductCategories />
        <WhyChooseVip />
        <About />
      </main>
    </>
  )
}
