import { getAnalyticsOverview, getTrafficOverview } from '@/app/actions/analytics'
import Analytics from '@/components/admin/Analytics.jsx'
import { AlertIcon } from '@/components/icons.jsx'

export const metadata = { title: 'Back office — analytics' }

export default async function AnalyticsPage() {
  // Two reads, not one: traffic is an optional install and fails on its own
  // terms, so a site without the visitor table still gets its sales figures.
  const [{ data, error }, traffic] = await Promise.all([getAnalyticsOverview(), getTrafficOverview()])

  return (
    <>
      <h1 className="display-wide text-display-2 text-ink font-semibold">Analytics</h1>
      <p className="text-ink-soft max-w-measure mt-3 leading-relaxed">
        Sales, top products, the shelf and how many people visited the site — with a monthly or yearly PDF for the
        books below.
      </p>

      {error ? (
        <p
          role="alert"
          className="border-hot-600/40 bg-hot-600/[0.06] text-ink mt-8 flex items-start gap-2.5 border px-3.5 py-3 text-sm leading-relaxed"
        >
          <AlertIcon className="text-hot-600 mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : (
        <div className="mt-8">
          <Analytics data={data} traffic={traffic} />
        </div>
      )}
    </>
  )
}
