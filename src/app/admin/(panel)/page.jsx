import { redirect } from 'next/navigation'
import { readAdminSession } from '@/utils/admin-session'
import { getAccountsOverview } from '@/app/actions/admin'
import { getPendingVerifications } from '@/app/actions/verification'
import AdminTopBar from '@/components/admin/TopBar.jsx'
import ReviewQueue from '@/components/admin/ReviewQueue.jsx'

/**
 * The gate runs here, on the server, before anything is rendered — not in a
 * client effect that would ship the queue to the browser first and hide it
 * afterwards. It is also not the only gate: the rows below are fetched with
 * the visitor's own session, and RLS returns nothing to a session that is not
 * an admin regardless of what this function decided.
 */
export default async function AdminPage() {
  const { user, profile, isAdmin } = await readAdminSession()

  // The site's own log-in, not a second one: signIn() reads the profile and
  // sends an admin back here by itself, so arriving logged-out is a round trip
  // through the same front door every customer uses.
  if (!user) redirect('/login')
  if (!isAdmin) redirect('/admin/setup')

  const [queue, accounts] = await Promise.all([getPendingVerifications(), getAccountsOverview()])

  return (
    <>
      <AdminTopBar name={profile?.full_name || user.email} pending={queue.data?.length ?? 0} />
      <ReviewQueue initialQueue={queue.data ?? []} accounts={accounts.data ?? []} currentUserId={user.id} />
    </>
  )
}
