import { redirect } from 'next/navigation'
import { getMyOrders } from '@/app/actions/account'
import { readAdminSession } from '@/utils/admin-session'
import PurchaseHistory from '@/components/PurchaseHistory.jsx'
import { Eyebrow, SectionHeading } from '@/components/ui.jsx'
import { AlertIcon } from '@/components/icons.jsx'

export const metadata = {
  title: 'Purchase history — VIP Solar',
  robots: { index: false, follow: false },
}

/**
 * Inside the (site) group, so it keeps the header and footer: this is the
 * customer's own corner of the shop, not a separate application.
 */
export default async function PurchaseHistoryPage() {
  const { user, profile } = await readAdminSession()
  if (!user) redirect('/login')

  const { data, error } = await getMyOrders()

  return (
    <main id="content" className="pt-nav">
      <section className="rail py-20 lg:py-28">
        <div className="rail-inner">
          <Eyebrow>Your account</Eyebrow>
          <SectionHeading className="mt-6">Purchase history</SectionHeading>
          <p className="text-ink-soft max-w-measure mt-6 leading-relaxed">
            Everything ordered under {profile?.full_name ? `${profile.full_name} · ` : ''}
            <span className="font-mono text-[0.9375rem]">{user.email}</span>. Orders stay here after they are
            delivered or cancelled, so the record does not disappear when the parcel does.
          </p>

          {error ? (
            <p
              role="alert"
              className="border-hot-600/40 bg-hot-600/[0.06] text-ink mt-10 flex items-start gap-2.5 border px-3.5 py-3 text-sm leading-relaxed"
            >
              <AlertIcon className="text-hot-600 mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          ) : (
            <PurchaseHistory orders={data ?? []} />
          )}
        </div>
      </section>
    </main>
  )
}
