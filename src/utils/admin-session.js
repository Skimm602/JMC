import { createClient } from '@/utils/supabase/server'

/**
 * Who is asking, and are they an admin.
 *
 * Server-side only, and it re-reads both the session and the profile on every
 * call rather than trusting anything that arrived with the request. The
 * database enforces the same answer independently — these checks decide what
 * to *render*, not what a session is allowed to touch.
 */
export async function readAdminSession() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { supabase, user: null, profile: null, isAdmin: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, full_name')
    .eq('id', user.id)
    .maybeSingle()

  return { supabase, user, profile, isAdmin: Boolean(profile?.is_admin) }
}

/**
 * Whether the site has an owner yet — the one thing the entry pages need to
 * know before anybody has logged in, because it decides whether the first
 * account is claimed or has to be let in by an existing admin.
 *
 * It leaks a single bit to anyone who reaches /admin, and that bit is already
 * obvious from the form they are looking at.
 */
export async function adminExists() {
  const supabase = await createClient()
  const { data } = await supabase.rpc('admin_exists')
  return Boolean(data)
}
