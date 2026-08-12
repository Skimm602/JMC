'use server'

import { createClient } from '@/utils/supabase/server'
import { readAdminSession } from '@/utils/admin-session'

/**
 * Back-office authentication.
 *
 * /admin is not linked from anywhere and is not indexed, but neither of those
 * is a lock — anyone who types the URL arrives at these forms. What actually
 * separates an admin from a visitor is `profiles.is_admin`, and an ordinary
 * browser session cannot write that column: a database trigger pins it.
 *
 * Three things can turn it on:
 *
 *   grant_admin_on_register()  — /admin/register. Open by the owner's explicit
 *                                choice: anybody who reaches that URL becomes
 *                                an admin. The path is the only secret.
 *   claim_first_admin()        — /admin/setup, for an account that already
 *                                exists on a site that has no admin yet.
 *   set_admin()                — the Accounts table, pressed by an admin, to
 *                                promote or demote somebody else.
 *
 * The trigger still pins the column against everything else, so a customer
 * cannot promote themselves by calling the REST API directly. What the open
 * registration page gives away is the door, not the lock behind it.
 */

/** What every failed credential check says, whatever actually went wrong. */
const REJECTED = 'Those credentials were not accepted.'

/**
 * adminSignIn(formData)
 *
 * Expects: email, password.
 *
 * Returns { success: true, isAdmin: boolean } — a correct password for a
 * non-admin account is still a correct password, so it signs in and lets the
 * caller route to the setup step rather than pretending the login failed.
 * Wrong credentials return one flat message: distinguishing "no such account"
 * from "wrong password" would turn this form into a way to enumerate who has
 * an account.
 */
export async function adminSignIn(formData) {
  const supabase = await createClient()

  const email = formData.get('email')
  const password = formData.get('password')

  if (!email || !password) return { error: 'Email and password are required.' }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: REJECTED }

  const { isAdmin } = await readAdminSession()
  return { success: true, isAdmin }
}

/**
 * adminSignUp(formData)
 *
 * Expects: email, password, full_name.
 *
 * Open. Every account made here becomes an admin, whether or not the site
 * already has one and whoever is filling in the form — the URL is the only
 * thing standing between a stranger and the back office. That is the owner's
 * explicit decision; see the note at the top of /admin/register.
 *
 * Registration ends at the site log-in either way, so the session sign-up
 * handed out is dropped on the way there. If email confirmation is switched on
 * there is no session to promote at all — the account still exists, so the
 * caller is told to log in and finish at /admin/setup.
 */
export async function adminSignUp(formData) {
  const supabase = await createClient()

  const email = formData.get('email')
  const password = formData.get('password')
  const fullName = formData.get('full_name')

  if (!email || !password) return { error: 'Email and password are required.' }
  if (!fullName) return { error: 'Full name is required.' }
  if (String(password).length < 8) return { error: 'Use at least 8 characters for the password.' }

  const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
  if (signUpError) return { error: signUpError.message }
  if (!data?.user) return { error: 'Could not create the account. Please try again.' }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    customer_type: 'individual',
    full_name: fullName,
  })

  // A duplicate is not a failure here: signing up twice with the same address
  // returns the existing user, and the profile row is already there.
  if (profileError && profileError.code !== '23505') {
    return { error: `Account created but profile setup failed: ${profileError.message}` }
  }

  if (!data.session) {
    return { success: true, granted: false, needsConfirmation: true }
  }

  const { data: granted, error: grantError } = await supabase.rpc('grant_admin_on_register')
  if (grantError) return { error: grantError.message }

  if (!granted) {
    return {
      success: true,
      granted: false,
      error: 'The account was created, but admin access could not be given. Log in and try again.',
    }
  }

  return grantedAndSignedOut(supabase)
}

/**
 * Registration ends at the site's own log-in page, so the session sign-up
 * handed out is dropped on the way there. Otherwise the account arrives at a
 * log-in form it is already past, and typing a password into a form you are
 * already through is the kind of thing that reads as broken when it fails.
 *
 * Signing out here is also what makes the next step meaningful: the role was
 * granted a moment ago, and the log-in is where it first gets used.
 */
async function grantedAndSignedOut(supabase) {
  await supabase.auth.signOut()
  return { success: true, granted: true }
}

/**
 * claimFirstAdmin()
 *
 * The same window as above, for an account that already exists — logging in
 * with the ordinary site account and taking the role from /admin/setup rather
 * than making a second account to hold it.
 */
export async function claimFirstAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session has expired. Log in again.' }

  const { data: claimed, error } = await supabase.rpc('claim_first_admin')

  if (error) return { error: error.message }
  if (!claimed) return { error: 'This site already has an admin. Ask them to add you from the Accounts table.' }

  return { success: true }
}

/**
 * setAdmin(targetId, value)
 *
 * How every admin after the first one is made: an existing admin turns the
 * role on for an account that already exists. There is no code to hand over,
 * because the person pressing this has already proved who they are.
 *
 * The database refuses to let anyone switch their own access off, so the last
 * admin cannot leave the panel with nobody able to open it.
 */
export async function setAdmin(targetId, value) {
  const supabase = await createClient()

  const { data: changed, error } = await supabase.rpc('set_admin', {
    p_target: targetId,
    p_value: Boolean(value),
  })

  if (error) return { error: error.message }
  if (!changed) return { error: 'That account could not be updated.' }

  return { success: true }
}

export async function adminSignOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  if (error) return { error: error.message }
  return { success: true }
}

/**
 * getAccountsOverview()
 *
 * Admin only. The queue answers "who is waiting"; this answers "who is here" —
 * the roll the reviewer needs to see that an approval actually landed.
 */
export async function getAccountsOverview() {
  const { supabase, isAdmin } = await readAdminSession()
  if (!isAdmin) return { error: 'Not authorized' }

  // The admins table is keyed by email, not by the profile's uuid, so the
  // matching happens in the database where both are visible. What comes back
  // here is a plain list of uuids, and the table in the UI still gets one flat
  // `is_admin` per row — the component never has to know how it was worked out.
  const [{ data: profiles, error }, { data: adminIds }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, company_name, customer_type, verification_status, created_at')
      .order('created_at', { ascending: false }),
    supabase.rpc('admin_user_ids'),
  ])

  if (error) return { error: error.message }

  const admins = new Set(adminIds ?? [])

  return { data: (profiles ?? []).map((p) => ({ ...p, is_admin: admins.has(p.id) })) }
}
