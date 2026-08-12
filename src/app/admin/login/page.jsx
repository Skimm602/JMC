import { redirect } from 'next/navigation'
import { adminExists, readAdminSession } from '@/utils/admin-session'
import AuthShell from '@/components/admin/AuthShell.jsx'
import AdminLoginForm from '@/components/admin/LoginForm.jsx'

export const metadata = { title: 'Back office — log in' }

export default async function AdminLoginPage({ searchParams }) {
  const { isAdmin } = await readAdminSession()
  if (isAdmin) redirect('/admin')

  const params = await searchParams
  const finishSetup = params?.setup === '1'
  const hasOwner = await adminExists()

  return (
    <AuthShell
      eyebrow={hasOwner ? 'Restricted' : 'First run'}
      title="Back office"
      intro={
        finishSetup
          ? 'Your account has been created. Confirm your email if you were asked to, then log in here to finish.'
          : 'Staff access to installer verification. This page is not linked from the site.'
      }
      footer={
        hasOwner ? (
          <>
            Issued a setup code but no account yet?{' '}
            <a href="/admin/register" className="text-glint border-b border-current/40 pb-px hover:border-current">
              Register one
            </a>
            .
          </>
        ) : (
          <>
            No admin exists on this site yet — log in with any account to take the role, or{' '}
            <a href="/admin/register" className="text-glint border-b border-current/40 pb-px hover:border-current">
              create one
            </a>
            .
          </>
        )
      }
    >
      <AdminLoginForm />
    </AuthShell>
  )
}
