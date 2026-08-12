import Nav from '@/components/Nav.jsx'
import Footer from '@/components/Footer.jsx'

/**
 * The public site: home, the product pages, registration and log-in. The bar
 * and the footer belong to all of them, so they live here rather than being
 * composed into each page and drifting apart. The skip link lands on the
 * page's own content, which is the only thing that differs between them.
 *
 * The group's parentheses keep it out of the URL — /register is still
 * /register. What the group buys is a boundary: /admin sits outside it and so
 * inherits none of this.
 */
export default function SiteLayout({ children }) {
  return (
    <>
      <a
        href="#content"
        className="focus:bg-cool-600 focus:text-glare sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>

      <Nav />
      {children}
      <Footer />
    </>
  )
}
