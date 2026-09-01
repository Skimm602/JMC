'use server'

import { createClient } from '@/utils/supabase/server'
import { notifyApplicantRejected } from '@/utils/support/notify'

const BUCKET = 'verification-docs'
const TABLE = 'installer_verifications'

/** Generous relative to what these actually are — a scanned certificate
    rarely exceeds a few MB — but set high enough that a large multi-page
    scan or a high-resolution photo is never the reason a genuine document
    gets rejected. */
const MAX_DOC_BYTES = 50 * 1024 * 1024

/** Matches what Registration.jsx's own dropzone already accepts (PDF, JPG,
    PNG, WEBP, DOC, DOCX). Neither that allowlist nor a size cap was ever
    mirrored server-side, so a request built by hand — skipping the form
    entirely — could upload anything, of any size, into a bucket an admin
    later opens during review. */
const DOC_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

/** Extension from the upload's own name rather than assumed, so a PDF
    business-registration scan is no longer stored (and later opened by an
    admin) mislabeled as a .jpg. */
function extensionOf(file, fallback) {
  const ext = file?.name?.split('.').pop()
  return ext && ext.length <= 5 ? ext.toLowerCase() : fallback
}

/** Checked before either file reaches Storage. Returns an error string, or
    null when the file is fine. */
function docFileError(file, noun) {
  if (file.size > MAX_DOC_BYTES) return `${noun} is over ${MAX_DOC_BYTES / (1024 * 1024)} MB.`
  if (file.type && !DOC_TYPES.has(file.type)) return `${noun} has to be a PDF, an image, or a Word document.`
  return null
}

/**
 * submitVerification(formData)
 *
 * Expects formData to include:
 *   - business_registration_number (string, required)
 *   - years_installing              (string/number, required)
 *   - annual_install_volume         (string/number, optional)
 *   - primary_service_area          (string, optional)
 *   - business_registration         (File: PDF, JPG, PNG, WEBP, DOC or DOCX, required)
 *   - pv_certification              (File: same types, optional)
 *
 * Uploads both documents to Storage, then upserts one row per installer
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

  if (
    !businessRegNumber ||
    !yearsInstalling ||
    !businessRegFile ||
    typeof businessRegFile === 'string' ||
    businessRegFile.size === 0
  ) {
    return { error: 'Business registration number, years installing, and the business registration document are required.' }
  }

  const businessRegError = docFileError(businessRegFile, 'The business registration document')
  if (businessRegError) return { error: businessRegError }

  const hasPvCert = pvCertFile && typeof pvCertFile !== 'string' && pvCertFile.size > 0
  if (hasPvCert) {
    const pvCertError = docFileError(pvCertFile, 'The PV certification document')
    if (pvCertError) return { error: pvCertError }
  }

  // Upload the document(s) to Storage under the user's own folder. The PV
  // certification is optional, so it's only uploaded when provided.
  const businessRegPath = `${user.id}/business_registration_${Date.now()}.${extensionOf(businessRegFile, 'jpg')}`
  const { error: uploadError1 } = await supabase.storage
    .from(BUCKET)
    .upload(businessRegPath, businessRegFile, { upsert: true, contentType: businessRegFile.type || undefined })

  if (uploadError1) return { error: `Business registration upload failed: ${uploadError1.message}` }

  let pvCertPath = null
  if (hasPvCert) {
    pvCertPath = `${user.id}/pv_certification_${Date.now()}.${extensionOf(pvCertFile, 'jpg')}`
    const { error: uploadError2 } = await supabase.storage
      .from(BUCKET)
      .upload(pvCertPath, pvCertFile, { upsert: true, contentType: pvCertFile.type || undefined })

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
 * rejectVerification(profileId, reason, filePaths)
 *
 * Admin only. A rejected installer applicant does not get to resubmit — the
 * account (auth login, profile) is deleted via delete_user_account()
 * (supabase-reject-deletes-account.sql), the same function the Accounts tab
 * uses. If they want to try again, that means registering fresh, not
 * correcting a submission in place.
 *
 * The verification row itself is not part of that deletion — it's written
 * with the rejection first, and installer_verifications.profile_id is
 * ON DELETE SET NULL, so it survives as a standalone record of what was
 * submitted and why it was turned down, detached from the account once that
 * account is gone.
 *
 * filePaths: array of storage paths to delete, e.g.
 *   [businessRegPath, pvCertPath]
 */
export async function rejectVerification(profileId, reason, filePaths) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: 'Not authorized' }

  const trimmedReason = String(reason ?? '').trim()
  if (!trimmedReason) {
    return { error: 'Say why. It stays on record after the account itself is gone.' }
  }

  // Read before anything below deletes it — this is the only chance to tell
  // the applicant why, and delete_user_account() takes their address with it.
  const { data: applicant } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', profileId)
    .maybeSingle()

  if (filePaths?.length) {
    await supabase.storage.from(BUCKET).remove(filePaths)
  }

  const { data: current } = await supabase
    .from(TABLE)
    .select('rejection_history')
    .eq('profile_id', profileId)
    .maybeSingle()

  const { error: verificationError } = await supabase
    .from(TABLE)
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      rejection_history: [...(current?.rejection_history || []), { reason: trimmedReason, rejected_at: new Date().toISOString() }],
      business_registration_url: null,
      pv_certification_url: null,
    })
    .eq('profile_id', profileId)

  if (verificationError) return { error: verificationError.message }

  // Best-effort, and before the delete — a mail provider having a bad
  // afternoon must not block a rejection the admin has already decided on,
  // but this is the last point at which there is an address to send it to.
  if (applicant?.email) {
    await notifyApplicantRejected({
      name: applicant.full_name || 'there',
      email: applicant.email,
      reason: trimmedReason,
    })
  }

  const { data: deleted, error } = await supabase.rpc('delete_user_account', { p_target: profileId })
  if (error) return { error: error.message }
  if (!deleted) return { error: 'That account could not be deleted.' }

  return { success: true }
}