import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function InstallerLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('customer_type, verification_status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.customer_type !== 'installer') {
    redirect('/products') // wrong account type entirely
  }

  if (profile.verification_status === 'pending') {
    redirect('/installer-status/pending-verification')
  }

  if (profile.verification_status === 'rejected') {
    redirect('/installer-status/verification-rejected')
  }

  // only reaches here if approved
  return <>{children}</>
}