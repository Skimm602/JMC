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

  // Two questions, two places, on purpose: who they are lives in `profiles`,
  // and whether they run this site lives in `admins`. is_admin() is asked
  // rather than the table read directly, so the answer here is the same one
  // every RLS policy in the database gets.
  const [{ data: profile }, { data: isAdmin }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase.rpc('is_admin'),
  ])

  return { supabase, user, profile, isAdmin: Boolean(isAdmin) }
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
