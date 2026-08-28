import { getStorefront } from '@/app/actions/catalogue'
import Hero from '@/components/Hero.jsx'
import StickyCta from '@/components/StickyCta.jsx'
import ShopShelf from '@/components/ShopShelf.jsx'
import ProductCategories from '@/components/ProductCategories.jsx'
import WhyChooseVip from '@/components/WhyChooseVip.jsx'
import About from '@/components/About.jsx'
import Brands from '@/components/Brands.jsx'
import Projects from '@/components/Projects.jsx'

/**
 * A shop's front page, in a shop's order.
 *
 * It used to run offer → categories → company → work → reasons → brands,
 * which is the order a contractor introduces themselves in: the visitor met
 * three category doors and then read about the business for four sections
 * before anything with a price was in front of them. That is what made the
 * site read as an installer's site rather than a store.
 *
 * The selling now comes first and the proof comes after it: the offer, real
 * stock off the catalogue, the shelves it sits on, the brands behind it —
 * then why buy here, who you are buying from, and the roofs the same
 * equipment is already on. Everything below the shelf exists to close the
 * sale the top of the page opened.
 *
 * The catalogue is fetched once here and handed to both the hero (which
 * counts it) and the shelf (which shows it), so the page makes one query.
 *
 * The detailed spec-comparison range, the sizing calculator, the installer-
 * tier table and the engineering-arguments section are no longer on this page
 * — kept as components (`Products.jsx`, `Sizing.jsx`, `InstallerProgram.jsx`,
 * `WhyVip.jsx`) but unmounted here. `/products` remains the full catalogue.
 */
export default async function Home() {
  // A catalogue that fails to load must not take the front page down with it:
  // every section below stands on its own, and ShopShelf renders nothing when
  // it is handed nothing.
  const { data, isInstaller } = await getStorefront()
  const products = data ?? []

  return (
    <>
      <main id="content">
        <Hero productCount={products.length} />
        <ShopShelf products={products} isInstaller={isInstaller} />
        <ProductCategories />
        <Brands />
        <WhyChooseVip />
        <About />
        <Projects />
      </main>

      <StickyCta />
    </>
  )
}
