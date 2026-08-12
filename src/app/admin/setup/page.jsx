import { redirect } from 'next/navigation'
import { adminExists, readAdminSession } from '@/utils/admin-session'
import AuthShell from '@/components/admin/AuthShell.jsx'
import AdminSetupForm from '@/components/admin/SetupForm.jsx'

export const metadata = { title: 'Back office — setup' }

export default async function AdminSetupPage() {
  const { user, isAdmin } = await readAdminSession()

  if (!user) redirect('/login')
  if (isAdmin) redirect('/admin')

  const hasOwner = await adminExists()

  // A signed-in account that is not an admin, on a site that already has one.
  // There is no self-service route from here — that is the point — so it says
  // so plainly rather than showing a control that would always refuse.
  if (hasOwner) {
    return (
      <AuthShell
        eyebrow="Restricted"
        title="No access on this account"
        intro="You are logged in, but this account is not an admin. Back-office access is granted from inside the panel by someone who already has it."
        footer={
          <>
            Wrong account?{' '}
            <a href="/login" className="text-glint border-b border-current/40 pb-px hover:border-current">
              Log in as someone else
            </a>
            .
          </>
        }
      >
        <p className="border-rule text-ink-soft border border-dashed px-4 py-6 text-center text-sm leading-relaxed">
          Ask an existing admin to add you from the Accounts table.
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="First run"
      title="One step left"
      intro="No admin exists on this site yet. You are logged in, so you can simply take the role — nothing to enter."
      footer={
        <>
          Wrong account?{' '}
          <a href="/login" className="text-glint border-b border-current/40 pb-px hover:border-current">
            Log in as someone else
          </a>
          .
        </>
      }
    >
      <AdminSetupForm />
    </AuthShell>
  )
}
