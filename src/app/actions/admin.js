'use server'

import { createClient } from '@/utils/supabase/server'
import { readAdminSession } from '@/utils/admin-session'

/**
 * Back-office authentication.
 *
 * /admin is not linked from anywhere and is not indexed, but neither of those
 * is a lock — anyone who types the URL arrives at these forms. What actually
 * separates an admin from a visitor is `profiles.is_admin`, and that column is
 * not writable from a browser session at all: a database trigger pins it, and
 * two SECURITY DEFINER functions are the only things that can turn it on.
 *
 * Which of the two applies depends on whether the site has an owner yet:
 *
 *   no admin exists  → claim_first_admin(). The window is open exactly once,
 *                      closes on use, and cannot reopen.
 *   an admin exists  → redeem_admin_setup_code(). A single-use code, stored as
 *                      a hash in a table the anon key cannot reach.
 *
 * So the first account needs nothing but a password, and every account after
 * it needs something the existing admin handed over.
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
 * Expects: email, password, full_name, setup_code.
 *
 * Creates the account, its profile row, and then grants it — by claim if the
 * site has no admin yet, by code if it does. The code is only asked for in the
 * second case, which is why the form does not always show that field.
 *
 * If the project has email confirmation switched on there is no session yet
 * and nothing can be granted — the account exists, so the answer is to log in
 * and finish at /admin/setup rather than to fail the whole thing.
 */
export async function adminSignUp(formData) {
  const supabase = await createClient()

  const email = formData.get('email')
  const password = formData.get('password')
  const fullName = formData.get('full_name')
  const setupCode = formData.get('setup_code')

  // Read before creating the account, so the form's own reasoning and the
  // server's agree about which of the two paths this sign-up is on.
  const { data: hasOwner } = await supabase.rpc('admin_exists')

  if (!email || !password) return { error: 'Email and password are required.' }
  if (!fullName) return { error: 'Full name is required.' }
  if (hasOwner && !setupCode) return { error: 'A setup code is required.' }
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

  if (!hasOwner) {
    const { data: claimed, error: claimError } = await supabase.rpc('claim_first_admin')
    if (claimError) return { error: claimError.message }
    if (!claimed) {
      // Somebody took the window between the check above and this call.
      return {
        success: true,
        granted: false,
        error: 'The account was created, but this site already has an admin. Ask them for a setup code.',
      }
    }
    return grantedAndSignedOut(supabase)
  }

  const { data: granted, error: rpcError } = await supabase.rpc('redeem_admin_setup_code', {
    p_code: String(setupCode).trim(),
  })

  if (rpcError) return { error: rpcError.message }
  if (!granted) {
    return {
      success: true,
      granted: false,
      error: 'The account was created, but that setup code is not valid or has already been used.',
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
  if (!claimed) return { error: 'This site already has an admin. You need a setup code from them.' }

  return { success: true }
}

/**
 * redeemAdminCode(formData)
 *
 * Expects: setup_code. Promotes the account already signed in on this session.
 * Separate from sign-up because an account can exist before its code does —
 * email confirmation, a code issued later, a second admin being added.
 */
export async function redeemAdminCode(formData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session has expired. Log in again.' }

  const setupCode = formData.get('setup_code')
  if (!setupCode) return { error: 'Enter your setup code.' }

  const { data: granted, error } = await supabase.rpc('redeem_admin_setup_code', {
    p_code: String(setupCode).trim(),
  })

  if (error) return { error: error.message }
  if (!granted) return { error: 'That setup code is not valid or has already been used.' }

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

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, company_name, customer_type, verification_status, is_admin, created_at')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}
