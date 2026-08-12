import { redirect } from 'next/navigation'
import { readAdminSession } from '@/utils/admin-session'
import { getPendingVerifications } from '@/app/actions/verification'
import AdminSidebar from '@/components/admin/Sidebar.jsx'

/**
 * Everything behind the rail.
 *
 * The gate lives here rather than in each page, so a new screen added under
 * this folder is protected by existing rather than by somebody remembering.
 * It is also not the only gate: every query below runs on the visitor's own
 * session, and RLS returns an admin nothing unless they are one.
 *
 * The waiting count is fetched here because the rail shows it on every page,
 * not only on the queue.
 */
export default async function PanelLayout({ children }) {
  const { user, profile, isAdmin } = await readAdminSession()

  if (!user) redirect('/login')
  if (!isAdmin) redirect('/admin/setup')

  const queue = await getPendingVerifications()

  return (
    <div className="band-sheet min-h-dvh">
      <AdminSidebar name={profile?.full_name || user.email} pending={queue.data?.length ?? 0} />

      {/* The rail is fixed and 17rem wide, so the content column is inset by
          the same amount rather than sliding underneath it. */}
      <main id="content" className="lg:pl-[17rem]">
        <div className="mx-auto max-w-[70rem] px-5 py-10 sm:px-8 lg:py-14">{children}</div>
      </main>
    </div>
  )
}
