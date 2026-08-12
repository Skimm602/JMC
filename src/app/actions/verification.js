'use server'

import { createClient } from '@/utils/supabase/server'

const BUCKET = 'verification-docs'
const TABLE = 'installer_verifications'

/**
 * submitVerification(formData)
 *
 * Expects formData to include:
 *   - business_registration_number (string, required)
 *   - years_installing              (string/number, required)
 *   - annual_install_volume         (string/number, optional)
 *   - primary_service_area          (string, optional)
 *   - business_registration         (File, image, required)
 *   - pv_certification              (File, image, optional)
 *
 * Uploads both images to Storage, then upserts one row per installer
 * profile in installer_verifications (unique_profile_id constraint makes
 * this an update-in-place on resubmission rather than a new row).
 *
 * Returns:
 *   { success: true }
 *   { error: string }
 */
export async function submitVerification(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from(TABLE)
    .select('locked_until, last_attempt_at, attempt_count')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (existing?.locked_until && new Date(existing.locked_until) > new Date()) {
    return { error: `Account under review hold until ${existing.locked_until}` }
  }

  if (existing?.last_attempt_at) {
    const hoursSinceLast = (Date.now() - new Date(existing.last_attempt_at)) / (1000 * 60 * 60)
    if (hoursSinceLast < 24) {
      return { error: 'You can only resubmit once every 24 hours' }
    }
  }

  const businessRegNumber = formData.get('business_registration_number')
  const yearsInstalling = formData.get('years_installing')
  const annualVolume = formData.get('annual_install_volume') || null
  const serviceArea = formData.get('primary_service_area') || null
  const businessRegFile = formData.get('business_registration')
  const pvCertFile = formData.get('pv_certification')

  if (!businessRegNumber || !yearsInstalling || !businessRegFile) {
    return { error: 'Business registration number, years installing, and the business registration document are required.' }
  }

  // Upload the document image(s) to Storage under the user's own folder.
  // The PV certification is optional, so it's only uploaded when provided.
  const businessRegPath = `${user.id}/business_registration_${Date.now()}.jpg`
  const { error: uploadError1 } = await supabase.storage
    .from(BUCKET)
    .upload(businessRegPath, businessRegFile, { upsert: true })

  if (uploadError1) return { error: `Business registration upload failed: ${uploadError1.message}` }

  let pvCertPath = null
  if (pvCertFile && pvCertFile.size > 0) {
    pvCertPath = `${user.id}/pv_certification_${Date.now()}.jpg`
    const { error: uploadError2 } = await supabase.storage
      .from(BUCKET)
      .upload(pvCertPath, pvCertFile, { upsert: true })

    if (uploadError2) return { error: `PV certification upload failed: ${uploadError2.message}` }
  }

  const { error: upsertError } = await supabase
    .from(TABLE)
    .upsert({
      profile_id: user.id,
      business_registration_number: businessRegNumber,
      years_installing: yearsInstalling,
      annual_install_volume: annualVolume,
      primary_service_area: serviceArea,
      business_registration_url: businessRegPath,
      pv_certification_url: pvCertPath,
      status: 'pending',
      reviewed_at: null,
      reviewed_by: null,
      attempt_count: (existing?.attempt_count || 0) + 1,
      last_attempt_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' })

  if (upsertError) return { error: upsertError.message }

  await supabase.from('profiles')
    .update({ verification_status: 'pending' })
    .eq('id', user.id)

  return { success: true }
}

/**
 * getPendingVerifications()
 *
 * Admin only. Returns all installer_verifications rows awaiting review.
 */
export async function getPendingVerifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: 'Not authorized' }

  const { data, error } = await supabase
    .from(TABLE)
    .select('*, profiles(full_name, company_name, verification_status)')
    .is('reviewed_at', null)
    .order('submitted_at', { ascending: true })

  if (error) return { error: error.message }
  return { data }
}

/**
 * getSignedDocUrl(filePath)
 *
 * Admin only. Generates a short-lived signed URL for viewing a private
 * verification document.
 */
export async function getSignedDocUrl(filePath) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: 'Not authorized' }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 60 * 5) // 5-minute expiry

  if (error) return { error: error.message }
  return { url: data.signedUrl }
}

/**
 * approveVerification(verificationId, profileId)
 *
 * Admin only. Marks the installer's profile and verification row approved.
 */
export async function approveVerification(verificationId, profileId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: 'Not authorized' }

  const { error: profileError } = await supabase.from('profiles')
    .update({ verification_status: 'approved' })
    .eq('id', profileId)

  if (profileError) return { error: profileError.message }

  const { error: verificationError } = await supabase.from(TABLE)
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', verificationId)

  if (verificationError) return { error: verificationError.message }

  return { success: true }
}

/**
 * rejectVerification(verificationId, profileId, reason, filePaths)
 *
 * Admin only. Rejects the submission, deletes the uploaded document files,
 * appends to rejection_history, and applies a 7-day lock after 3+ rejections.
 *
 * filePaths: array of storage paths to delete, e.g.
 *   [businessRegPath, pvCertPath]
 */
export async function rejectVerification(verificationId, profileId, reason, filePaths) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: 'Not authorized' }

  if (filePaths?.length) {
    await supabase.storage.from(BUCKET).remove(filePaths)
  }

  const { data: current } = await supabase
    .from(TABLE)
    .select('rejection_history')
    .eq('id', verificationId)
    .maybeSingle()

  const updatedHistory = [
    ...(current?.rejection_history || []),
    { reason, rejected_at: new Date().toISOString() },
  ]

  const shouldLock = updatedHistory.length >= 3
  const lockedUntil = shouldLock
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    : null

  const { error: profileError } = await supabase.from('profiles')
    .update({ verification_status: 'rejected' })
    .eq('id', profileId)

  if (profileError) return { error: profileError.message }

  const { error: verificationError } = await supabase.from(TABLE)
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      rejection_history: updatedHistory,
      business_registration_url: null,
      pv_certification_url: null,
      locked_until: lockedUntil,
    })
    .eq('id', verificationId)

  if (verificationError) return { error: verificationError.message }

  // TODO: send rejection email via Resend here, mention lockedUntil if set

  return { success: true, locked: shouldLock }
}