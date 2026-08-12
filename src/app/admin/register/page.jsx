import { redirect } from 'next/navigation'
import { adminExists, readAdminSession } from '@/utils/admin-session'
import AuthShell from '@/components/admin/AuthShell.jsx'
import AdminRegisterForm from '@/components/admin/RegisterForm.jsx'

export const metadata = { title: 'Back office — register' }

export default async function AdminRegisterPage() {
  const { isAdmin } = await readAdminSession()
  if (isAdmin) redirect('/admin')

  // Which question this page is asking depends on whether the site has an
  // owner. Before it does, the first account through simply takes the role;
  // after that, it has to be let in by whoever already holds it.
  const hasOwner = await adminExists()

  return (
    <AuthShell
      eyebrow={hasOwner ? 'Restricted' : 'First run'}
      title={hasOwner ? 'Register an admin' : 'Claim this site'}
      intro={
        hasOwner
          ? 'Anyone can open this form. Only a valid setup code turns the account it makes into an admin one.'
          : 'No admin exists yet, so the account you make here becomes it. This offer closes the moment you take it — after that, new admins need a code from you.'
      }
      footer={
        <>
          Already have an account?{' '}
          <a href="/admin/login" className="text-glint border-b border-current/40 pb-px hover:border-current">
            Log in
          </a>
          {!hasOwner && ' and claim it from there instead'}.
        </>
      }
    >
      <AdminRegisterForm requiresCode={hasOwner} />
    </AuthShell>
  )
}
