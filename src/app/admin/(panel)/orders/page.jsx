import { getOrders } from '@/app/actions/orders'
import OrdersBoard from '@/components/admin/OrdersBoard.jsx'
import { AlertIcon } from '@/components/icons.jsx'

export const metadata = { title: 'Back office — orders' }

export default async function OrdersPage() {
  const { data, error } = await getOrders()

  return (
    <>
      <h1 className="display-wide text-display-2 text-ink font-semibold">Orders</h1>
      <p className="text-ink-soft max-w-measure mt-3 leading-relaxed">
        Approving an order takes its quantities out of stock in the same movement, and refuses outright if a line is
        short — so what the panel says is on the shelf stays true.
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
        <OrdersBoard orders={data ?? []} />
      )}
    </>
  )
}
