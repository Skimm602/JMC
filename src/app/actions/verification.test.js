import { beforeEach, describe, expect, it, vi } from 'vitest'
import { calledWith, createSupabaseStub, fakeFile, fakeFormData } from '@/test/supabaseMock.js'

vi.mock('@/utils/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/utils/support/notify', () => ({ notifyApplicantRejected: vi.fn(async () => ({ ok: true })) }))

const { createClient } = await import('@/utils/supabase/server')
const { notifyApplicantRejected } = await import('@/utils/support/notify')
const { approveVerification, getPendingVerifications, getSignedDocUrl, rejectVerification, submitVerification } =
  await import('./verification.js')

const USER = { id: 'installer-1', email: 'installer@example.com' }

const validForm = (overrides = {}) =>
  fakeFormData({
    business_registration_number: 'DTI-12345',
    years_installing: '5',
    annual_install_volume: '20',
    primary_service_area: 'Ormoc',
    business_registration: fakeFile({ name: 'dti.jpg' }),
    pv_certification: null,
    ...overrides,
  })

beforeEach(() => {
  vi.mocked(createClient).mockReset()
  vi.mocked(notifyApplicantRejected).mockClear()
})

describe('submitVerification', () => {
  it('refuses a submission from a logged-out visitor', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ user: null }))

    const result = await submitVerification(validForm())

    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('refuses a resubmission while the account is on a review hold', async () => {
    const lockedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: USER,
        from: { installer_verifications: { data: { locked_until: lockedUntil, last_attempt_at: null, attempt_count: 2 }, error: null } },
      }),
    )

    const result = await submitVerification(validForm())

    expect(result).toEqual({ error: `Account under review hold until ${lockedUntil}` })
  })

  it('refuses a resubmission within 24 hours of the last attempt', async () => {
    const lastAttempt = new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: USER,
        from: { installer_verifications: { data: { locked_until: null, last_attempt_at: lastAttempt, attempt_count: 1 }, error: null } },
      }),
    )

    const result = await submitVerification(validForm())

    expect(result).toEqual({ error: 'You can only resubmit once every 24 hours' })
  })

  it('allows a resubmission once 24 hours have passed', async () => {
    const lastAttempt = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() // 25 hours ago
    const stub = createSupabaseStub({
      user: USER,
      from: {
        installer_verifications: [
          { data: { locked_until: null, last_attempt_at: lastAttempt, attempt_count: 1 }, error: null },
          { error: null }, // the upsert
        ],
        profiles: { error: null },
      },
    })
    createClient.mockResolvedValue(stub)

    const result = await submitVerification(validForm())

    expect(result).toEqual({ success: true })
  })

  it('requires the business registration number, years installing and the document itself', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: USER,
        from: { installer_verifications: { data: null, error: null } },
      }),
    )

    const result = await submitVerification(validForm({ business_registration_number: '' }))

    expect(result).toEqual({
      error: 'Business registration number, years installing, and the business registration document are required.',
    })
  })

  it('surfaces a storage error rather than writing a row with no document behind it', async () => {
    const stub = createSupabaseStub({
      user: USER,
      from: { installer_verifications: { data: null, error: null } },
      storage: { upload: { data: null, error: { message: 'bucket quota exceeded' } } },
    })
    createClient.mockResolvedValue(stub)

    const result = await submitVerification(validForm())

    expect(result).toEqual({ error: 'Business registration upload failed: bucket quota exceeded' })
  })

  it('does not upload a PV certification that was not provided', async () => {
    const stub = createSupabaseStub({
      user: USER,
      from: {
        installer_verifications: [{ data: null, error: null }, { error: null }],
        profiles: { error: null },
      },
    })
    createClient.mockResolvedValue(stub)

    await submitVerification(validForm({ pv_certification: null }))

    const upsertRow = calledWith(stub, 'installer_verifications', 1)
    expect(upsertRow.pv_certification_url).toBeNull()
    expect(upsertRow.status).toBe('pending')
    expect(upsertRow.attempt_count).toBe(1)
  })

  it('carries the attempt count forward from a prior submission on resubmit', async () => {
    const stub = createSupabaseStub({
      user: USER,
      from: {
        installer_verifications: [
          { data: { locked_until: null, last_attempt_at: null, attempt_count: 3 }, error: null },
          { error: null },
        ],
        profiles: { error: null },
      },
    })
    createClient.mockResolvedValue(stub)

    await submitVerification(validForm())

    const upsertRow = calledWith(stub, 'installer_verifications', 1)
    expect(upsertRow.attempt_count).toBe(4)
  })
})

describe('admin-only reads', () => {
  it('getPendingVerifications refuses a non-admin', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ user: USER, rpc: { is_admin: { data: false, error: null } } }))

    const result = await getPendingVerifications()

    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('getSignedDocUrl refuses a non-admin', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ user: USER, rpc: { is_admin: { data: false, error: null } } }))

    const result = await getSignedDocUrl('installer-1/business_registration_1.jpg')

    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('getSignedDocUrl returns a signed URL for an admin', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: 'admin-1' },
        rpc: { is_admin: { data: true, error: null } },
        storage: { createSignedUrl: { data: { signedUrl: 'https://signed.example/doc.jpg' }, error: null } },
      }),
    )

    const result = await getSignedDocUrl('installer-1/business_registration_1.jpg')

    expect(result).toEqual({ url: 'https://signed.example/doc.jpg' })
  })
})

describe('approveVerification', () => {
  it('refuses a non-admin', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ user: USER, rpc: { is_admin: { data: false, error: null } } }))

    const result = await approveVerification('verification-1', 'installer-1')

    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('approves both the profile and the verification row', async () => {
    const stub = createSupabaseStub({
      user: { id: 'admin-1' },
      rpc: { is_admin: { data: true, error: null } },
      from: {
        profiles: { error: null },
        installer_verifications: { error: null },
      },
    })
    createClient.mockResolvedValue(stub)

    const result = await approveVerification('verification-1', 'installer-1')

    expect(result).toEqual({ success: true })
    expect(calledWith(stub, 'profiles').verification_status).toBe('approved')
    expect(calledWith(stub, 'installer_verifications').status).toBe('approved')
  })
})

describe('rejectVerification', () => {
  it('refuses a non-admin', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ user: USER, rpc: { is_admin: { data: false, error: null } } }))

    const result = await rejectVerification('installer-1', 'Expired licence', [])

    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('requires a reason', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'admin-1' }, rpc: { is_admin: { data: true, error: null } } }),
    )

    const result = await rejectVerification('installer-1', '   ', [])

    expect(result).toEqual({ error: 'Say why. It stays on record after the account itself is gone.' })
  })

  it('records the rejection, emails the applicant, and deletes the account', async () => {
    const stub = createSupabaseStub({
      user: { id: 'admin-1' },
      rpc: { is_admin: { data: true, error: null }, delete_user_account: { data: true, error: null } },
      from: {
        profiles: { data: { full_name: 'Juan Dela Cruz', email: 'juan@example.com' }, error: null },
        installer_verifications: [
          { data: { rejection_history: [] }, error: null },
          { error: null }, // the update()
        ],
      },
    })
    createClient.mockResolvedValue(stub)

    const result = await rejectVerification('installer-1', 'Licence expired', ['installer-1/doc.jpg'])

    expect(result).toEqual({ success: true })
    expect(notifyApplicantRejected).toHaveBeenCalledWith({
      name: 'Juan Dela Cruz',
      email: 'juan@example.com',
      reason: 'Licence expired',
    })

    const updateRow = calledWith(stub, 'installer_verifications', 1)
    expect(updateRow.status).toBe('rejected')
    expect(updateRow.rejection_history).toEqual([{ reason: 'Licence expired', rejected_at: expect.any(String) }])
  })

  it('reports failure when the account deletion itself does not go through', async () => {
    const stub = createSupabaseStub({
      user: { id: 'admin-1' },
      rpc: { is_admin: { data: true, error: null }, delete_user_account: { data: false, error: null } },
      from: {
        profiles: { data: { full_name: 'Juan Dela Cruz', email: 'juan@example.com' }, error: null },
        installer_verifications: [{ data: { rejection_history: [] }, error: null }, { error: null }],
      },
    })
    createClient.mockResolvedValue(stub)

    const result = await rejectVerification('installer-1', 'Licence expired', [])

    expect(result).toEqual({ error: 'That account could not be deleted.' })
  })
})
