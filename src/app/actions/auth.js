'use server'

import { createClient } from '@/utils/supabase/server'

/**
 * signUp(formData)
 *
 * Expects formData to include:
 *   - email          (string, required)
 *   - password       (string, required)
 *   - customer_type  ('individual' | 'installer', required)
 *   - full_name      (string, required)
 *   - company_name   (string, optional)
 *   - phone          (string, optional)
 *   - address        (string, optional)
 *   - country        (string, optional)
 *   - role           (string, optional)
 *
 * Creates the auth.users row (via supabase.auth.signUp) and the matching
 * profiles row in the same flow. Individual accounts get immediate access
 * (verification_status = 'not_required'). Installer accounts are created
 * as 'pending' and must go through document verification (see
 * verification.js's submitVerification) before they can access the
 * installer routes (enforced separately by the (installer) gating layout).
 *
 * Returns:
 *   { success: true, redirectTo: string }
 *   { error: string }
 */
export async function signUp(formData) {
  const supabase = await createClient()

  const email = formData.get('email')
  const password = formData.get('password')
  const customerType = formData.get('customer_type')

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  if (!['individual', 'installer'].includes(customerType)) {
    return { error: 'Please select an account type.' }
  }

  const fullName = formData.get('full_name')
  const companyName = formData.get('company_name') || null
  const phone = formData.get('phone') || null
  const address = formData.get('address') || null
  const country = formData.get('country') || null
  const role = formData.get('role') || null

  if (!fullName) {
    return { error: 'Full name is required.' }
  }

  // Step 1: create the auth user
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (signUpError) {
    return { error: signUpError.message }
  }

  if (!data?.user) {
    return { error: 'Could not create account. Please try again.' }
  }

  // Step 2: create the matching profile row
  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    customer_type: customerType,
    verification_status: customerType === 'installer' ? 'pending' : 'not_required',
    full_name: fullName,
    email,
    company_name: companyName,
    phone,
    address,
    country,
    role,
  })

  if (profileError) {
    // Auth user was created but profile insert failed — surface this clearly
    // so it can be investigated/cleaned up rather than silently leaving an
    // auth user with no matching profile row.
    return { error: `Account created but profile setup failed: ${profileError.message}` }
  }

  return {
    success: true,
    hasSession: Boolean(data.session),
    redirectTo:
      customerType === 'installer'
        ? '/installer-status/pending-verification'
        : '/products',
  }
}

/**
 * signIn(formData)
 *
 * Expects formData to include:
 *   - email     (string, required)
 *   - password  (string, required)
 *
 * Returns:
 *   { success: true, redirectTo: string }
 *   { error: string }
 *
 * There is one log-in on this site, not two. An admin signs in through the
 * same form as everybody else and is recognised here rather than at a separate
 * door — /admin is where they are sent, not where they have to start.
 *
 * Note: redirectTo is a landing page, not a permission. The (installer)
 * layout's gating still runs on every request, and /admin re-checks is_admin
 * server-side, so a tampered value buys nothing.
 */
export async function signIn(formData) {
  const supabase = await createClient()

  const email = formData.get('email')
  const password = formData.get('password')

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return { error: signInError.message }
  }

  // Whether this account runs the site lives in `admins`, not on the profile
  // row — is_admin() is the same question every RLS policy asks.
  const { data: isAdmin } = await supabase.rpc('is_admin')

  // An admin logging in is going to work, not to shop.
  if (isAdmin) {
    return { success: true, isAdmin: true, redirectTo: '/admin' }
  }

  // Home, until the routes these used to name actually exist. /products and
  // /dashboard were being returned by this action and neither is a page — the
  // form ignored the value, which is the only reason nobody hit a 404.
  return { success: true, isAdmin: false, redirectTo: '/' }
}

/**
 * signOut()
 *
 * Signs the current user out of their session.
 *
 * Returns:
 *   { success: true }
 *   { error: string }
 */
export async function signOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}