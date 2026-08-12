import { getAccountsOverview } from '@/app/actions/admin'
import { readAdminSession } from '@/utils/admin-session'
import AccountsTable from '@/components/admin/AccountsTable.jsx'
import { AlertIcon } from '@/components/icons.jsx'

export const metadata = { title: 'Back office — accounts' }

export default async function AccountsPage() {
  const [{ user }, { data, error }] = await Promise.all([readAdminSession(), getAccountsOverview()])

  return (
    <>
      <h1 className="display-wide text-display-2 text-ink font-semibold">Accounts</h1>
      <p className="text-ink-soft max-w-measure mt-3 leading-relaxed">
        Everyone with an account, and who can open this panel. Adding an admin is a button here — there is no invite
        code to issue and nothing to send anybody.
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
        <AccountsTable accounts={data ?? []} currentUserId={user?.id} />
      )}
    </>
  )
}
