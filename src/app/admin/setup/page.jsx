import { redirect } from 'next/navigation'
import { adminExists, readAdminSession } from '@/utils/admin-session'
import AuthShell from '@/components/admin/AuthShell.jsx'
import AdminSetupForm from '@/components/admin/SetupForm.jsx'

export const metadata = { title: 'Back office — setup' }

export default async function AdminSetupPage() {
  const { user, isAdmin } = await readAdminSession()

  if (!user) redirect('/admin/login')
  if (isAdmin) redirect('/admin')

  const hasOwner = await adminExists()

  return (
    <AuthShell
      eyebrow={hasOwner ? 'Restricted' : 'First run'}
      title="One step left"
      intro={
        hasOwner
          ? 'You are logged in, but this account has no back-office access yet. Redeeming a setup code grants it.'
          : 'No admin exists on this site yet. You are logged in, so you can simply take the role — nothing to enter.'
      }
      footer={
        <>
          Wrong account?{' '}
          <a href="/admin/login" className="text-glint border-b border-current/40 pb-px hover:border-current">
            Log in as someone else
          </a>
          .
        </>
      }
    >
      <AdminSetupForm requiresCode={hasOwner} />
    </AuthShell>
  )
}
