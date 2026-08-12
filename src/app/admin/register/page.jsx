import { redirect } from 'next/navigation'
import { readAdminSession } from '@/utils/admin-session'
import AuthShell from '@/components/admin/AuthShell.jsx'
import AdminRegisterForm from '@/components/admin/RegisterForm.jsx'

export const metadata = { title: 'Back office — register' }

/**
 * Where admins are made, and it is open.
 *
 * There is no code, no invite and no requirement to already be signed in: any
 * account created here becomes an admin. The URL is the whole of the secret.
 * That is a deliberate choice by the site owner, made after the alternatives
 * were on the table, and it is worth being blunt about what it costs — anyone
 * who guesses or is told this path owns the back office. Do not link to it, and
 * do not put it in a sitemap or a robots.txt.
 *
 * The flow the owner asked for, end to end:
 *
 *   /admin/register  →  account created, promoted, session dropped
 *                    →  /login  (the ordinary site log-in)
 *                    →  signIn() reads is_admin  →  /admin
 */
export default async function AdminRegisterPage() {
  const { isAdmin } = await readAdminSession()

  // Someone who can already open the panel has no business filling this in.
  if (isAdmin) redirect('/admin')

  return (
    <AuthShell
      eyebrow="Restricted"
      title="Register an admin"
      intro="Creates a back-office account. Once it is made you will be sent to the site log-in — sign in there and you land in the panel."
      footer={
        <>
          Already have an account?{' '}
          <a href="/login" className="text-glint border-b border-current/40 pb-px hover:border-current">
            Log in on the site
          </a>{' '}
          — an admin account lands in the back office by itself.
        </>
      }
    >
      <AdminRegisterForm />
    </AuthShell>
  )
}
