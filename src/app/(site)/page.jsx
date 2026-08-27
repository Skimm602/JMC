import Hero from '@/components/Hero.jsx'
import StickyCta from '@/components/StickyCta.jsx'
import ProductCategories from '@/components/ProductCategories.jsx'
import WhyChooseVip from '@/components/WhyChooseVip.jsx'
import About from '@/components/About.jsx'
import Brands from '@/components/Brands.jsx'
import Projects from '@/components/Projects.jsx'

/**
 * Registration is its own route now, so the page ends on the dealership
 * rather than on a form: what the range is, who backs it, why to buy it
 * here, then the marks that make the "authorised dealer" claim checkable —
 * in that order, because each one only lands if the argument before it did.
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
      <main id="content">
        <Hero />
        <ProductCategories />
        <About />
        <WhyChooseVip />
        <Brands />
        <Projects />
      </main>

      <StickyCta />
    </>
  )
}
