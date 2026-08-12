import { getProducts } from '@/app/actions/catalogue'
import StockTable from '@/components/admin/StockTable.jsx'
import { AlertIcon } from '@/components/icons.jsx'

export const metadata = { title: 'Back office — maintenance' }

export default async function MaintenancePage() {
  const { data, error } = await getProducts()

  return (
    <>
      <h1 className="display-wide text-display-2 text-ink font-semibold">Maintenance</h1>
      <p className="text-ink-soft max-w-measure mt-3 leading-relaxed">
        How many of each unit are on the shelf. Type the count you can see, not the difference — approving an order
        takes its quantity off automatically, so this is only for corrections and deliveries.
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
        <StockTable products={data ?? []} />
      )}
    </>
  )
}
