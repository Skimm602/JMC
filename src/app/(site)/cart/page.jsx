import { getCart } from '@/app/actions/cart'
import { createClient } from '@/utils/supabase/server'
import CartView from '@/components/CartView.jsx'
import { Eyebrow, Rule, SectionHeading } from '@/components/ui.jsx'
import { AlertIcon } from '@/components/icons.jsx'

export const metadata = {
  title: 'Cart — VIP Solar',
  description: 'Review what is in your cart, then check out.',
}

/**
 * Its own route rather than a drawer off the header: checking out a cart is
 * an address form and a total to agree to, same as buying one unit is on a
 * product page, and that does not fit in a panel that closes if you glance
 * away from it.
 */
export default async function CartPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error, isInstaller } = await getCart()

  return (
    <main id="content" className="pt-nav">
      <section className="rail py-20 lg:py-28">
        <div className="rail-inner">
          <Eyebrow>Shop</Eyebrow>
          <SectionHeading className="mt-6">Your cart</SectionHeading>

          <Rule className="mt-10" />

          {error ? (
            <p
              role="alert"
              className="border-hot-600/40 bg-hot-600/[0.06] text-ink mt-10 flex items-start gap-2.5 border px-3.5 py-3 text-sm leading-relaxed"
            >
              <AlertIcon className="text-hot-600 mt-0.5 h-4 w-4 shrink-0" />
              The cart could not be loaded: {error}
            </p>
          ) : (
            <div className="mt-10">
              <CartView data={data} isInstaller={isInstaller} signedIn={Boolean(user)} />
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
