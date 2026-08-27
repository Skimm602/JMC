import Nav from '@/components/Nav.jsx'
import Footer from '@/components/Footer.jsx'
import IntroScreen from '@/components/IntroScreen.jsx'
import RouteProgress from '@/components/RouteProgress.jsx'
import SupportButton from '@/components/SupportButton.jsx'
import PageViewTracker from '@/components/PageViewTracker.jsx'
import { createClient } from '@/utils/supabase/server'

/**
 * The public site: home, the product pages, registration and log-in. The bar
 * and the footer belong to all of them, so they live here rather than being
 * composed into each page and drifting apart. The skip link lands on the
 * page's own content, which is the only thing that differs between them.
 *
 * The group's parentheses keep it out of the URL — /register is still
 * /register. What the group buys is a boundary: /admin sits outside it and so
 * inherits none of this.
 *
 * The session is read here rather than in the bar itself. The bar is a client
 * component, and asking the browser who you are would render the logged-out
 * header first and correct it a moment later — a flash of "Create account" at
 * somebody who has had an account for a year.
 */
export default async function SiteLayout({ children }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: isAdmin } = user ? await supabase.rpc('is_admin') : { data: false }

  // Sum of quantities, not row count — "3" on the badge should mean three
  // units waiting to be ordered, the number that matters to a shopper,
  // whether that is one line of three or three lines of one.
  const { data: cartRows } = user
    ? await supabase.from('cart_items').select('quantity').eq('user_id', user.id)
    : { data: [] }
  const cartCount = (cartRows ?? []).reduce((sum, row) => sum + row.quantity, 0)

  return (
    <>
      {/* Above the skip link so the cover is parsed — and its "already seen"
          check has run — before anything else on the page. */}
      <IntroScreen />

      {/* Every in-app link click, everywhere in this group — the bar has no
          opinion on which page it is watching. */}
      <RouteProgress />

      {/* Counts visits to the public site only. It sits in this group rather
          than the root layout so the back office never counts itself — an
          admin working through Orders all morning is not traffic. */}
      <PageViewTracker />

      <a
        href="#content"
        className="focus:bg-cool-600 focus:text-glare sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>

      {/* Only what the header actually needs. Passing the whole Supabase user
          object into a client component would ship its tokens to the browser. */}
      <Nav user={user ? { email: user.email } : null} isAdmin={Boolean(isAdmin)} cartCount={cartCount} />
      {children}
      <Footer />

      {/* Signed-in only, and for the same reason the header takes only the
          address: a request sent under a session is one the back office can
          reply to without asking who it is from. Logged-out visitors still
          have the address in the footer. */}
      {user && <SupportButton email={user.email} />}
    </>
  )
}
