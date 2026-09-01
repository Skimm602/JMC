import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseStub, fakeFormData } from '@/test/supabaseMock.js'

vi.mock('@/utils/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('next/headers', () => ({ headers: vi.fn() }))
const { createClient } = await import('@/utils/supabase/server')
const { headers } = await import('next/headers')
const {
  adminSignIn,
  adminSignOut,
  adminSignUp,
  claimFirstAdmin,
  deleteUserAccount,
  getAccountsOverview,
  getLoginHistory,
  setAdmin,
} = await import('./admin.js')

/** No IP determinable — the default for every test that isn't specifically
    exercising the signup rate limiter. */
const NO_IP_HEADERS = { get: () => null }

const ipHeaders = (ip) => ({ get: (name) => (name === 'x-forwarded-for' ? ip : null) })

beforeEach(() => {
  vi.mocked(createClient).mockReset()
  vi.mocked(headers).mockReset().mockResolvedValue(NO_IP_HEADERS)
})

/** readAdminSession() reads auth.getUser(), then a profiles maybeSingle() and rpc('is_admin') in parallel — every admin-gated action pays this cost first. */
function adminSessionFixtures({ isAdmin }) {
  return {
    from: { profiles: { data: { full_name: 'Back Office' }, error: null } },
    rpc: { is_admin: { data: isAdmin, error: null } },
  }
}

describe('adminSignIn', () => {
  /** Every path past the empty-field check now hits the rate-limit gate first. */
  const notLimited = { is_login_rate_limited: { data: false, error: null }, record_login_attempt: { data: null, error: null } }

  it('requires email and password', async () => {
    createClient.mockResolvedValue(createSupabaseStub({}))

    const result = await adminSignIn(fakeFormData({ email: '', password: '' }))

    expect(result).toEqual({ error: 'Email and password are required.' })
  })

  it('refuses to even attempt sign-in once this email has failed too many times', async () => {
    const stub = createSupabaseStub({ rpc: { is_login_rate_limited: { data: true, error: null } } })
    createClient.mockResolvedValue(stub)

    const result = await adminSignIn(fakeFormData({ email: 'x@example.com', password: 'wrong' }))

    expect(result).toEqual({ error: 'Too many attempts on this account. Try again in a few minutes.' })
    expect(stub.auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it('gives one flat rejection message rather than confirming whether the account exists', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        rpc: notLimited,
        auth: { signInWithPassword: { data: null, error: { message: 'Invalid login credentials' } } },
      }),
    )

    const result = await adminSignIn(fakeFormData({ email: 'x@example.com', password: 'wrong' }))

    expect(result).toEqual({ error: 'Those credentials were not accepted.' })
  })

  it('signs in a non-admin account without granting access', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: 'user-1' },
        auth: { signInWithPassword: { data: { user: { id: 'user-1' } }, error: null } },
        rpc: { ...notLimited, record_login: { data: null, error: null }, ...adminSessionFixtures({ isAdmin: false }).rpc },
        from: adminSessionFixtures({ isAdmin: false }).from,
      }),
    )

    const result = await adminSignIn(fakeFormData({ email: 'x@example.com', password: 'right' }))

    expect(result).toEqual({ success: true, isAdmin: false })
  })

  it('signs in an admin account and reports it', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: 'admin-1' },
        auth: { signInWithPassword: { data: { user: { id: 'admin-1' } }, error: null } },
        rpc: { ...notLimited, record_login: { data: null, error: null }, ...adminSessionFixtures({ isAdmin: true }).rpc },
        from: adminSessionFixtures({ isAdmin: true }).from,
      }),
    )

    const result = await adminSignIn(fakeFormData({ email: 'admin@example.com', password: 'right' }))

    expect(result).toEqual({ success: true, isAdmin: true })
  })
})

describe('adminSignUp', () => {
  const validForm = (overrides = {}) =>
    fakeFormData({ email: 'owner@example.com', password: 'longenoughpw', full_name: 'Site Owner', ...overrides })

  it('requires email and password', async () => {
    createClient.mockResolvedValue(createSupabaseStub({}))
    expect(await adminSignUp(validForm({ password: '' }))).toEqual({ error: 'Email and password are required.' })
  })

  it('requires a full name', async () => {
    createClient.mockResolvedValue(createSupabaseStub({}))
    expect(await adminSignUp(validForm({ full_name: '' }))).toEqual({ error: 'Full name is required.' })
  })

  it('requires an 8-character password', async () => {
    createClient.mockResolvedValue(createSupabaseStub({}))
    expect(await adminSignUp(validForm({ password: 'short1' }))).toEqual({
      error: 'Use at least 8 characters for the password.',
    })
  })

  it('tolerates a duplicate-email profile insert rather than failing the registration', async () => {
    const stub = createSupabaseStub({
      auth: { signUp: { data: { user: { id: 'admin-1' }, session: null }, error: null } },
      from: { profiles: { error: { code: '23505', message: 'duplicate key' } } },
    })
    createClient.mockResolvedValue(stub)

    const result = await adminSignUp(validForm())

    expect(result).toEqual({ success: true, granted: false, needsConfirmation: true })
  })

  it('reports a real profile-insert failure rather than swallowing it', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        auth: { signUp: { data: { user: { id: 'admin-1' }, session: null }, error: null } },
        from: { profiles: { error: { code: '23000', message: 'check constraint violated' } } },
      }),
    )

    const result = await adminSignUp(validForm())

    expect(result.error).toContain('Account created but profile setup failed: check constraint violated')
  })

  it('asks for email confirmation when signUp granted no session', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        auth: { signUp: { data: { user: { id: 'admin-1' }, session: null }, error: null } },
        from: { profiles: { error: null } },
      }),
    )

    const result = await adminSignUp(validForm())

    expect(result).toEqual({ success: true, granted: false, needsConfirmation: true })
  })

  it('grants admin access and signs out when a session comes back', async () => {
    const stub = createSupabaseStub({
      auth: {
        signUp: { data: { user: { id: 'admin-1' }, session: { access_token: 'tok' } }, error: null },
        signOut: { error: null },
      },
      from: { profiles: { error: null } },
      rpc: { grant_admin_on_register: { data: true, error: null } },
    })
    createClient.mockResolvedValue(stub)

    const result = await adminSignUp(validForm())

    expect(result).toEqual({ success: true, granted: true })
    expect(stub.auth.signOut).toHaveBeenCalledTimes(1)
  })

  it('reports when the site already has an admin so registration cannot grant one', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        auth: { signUp: { data: { user: { id: 'admin-1' }, session: { access_token: 'tok' } }, error: null } },
        from: { profiles: { error: null } },
        rpc: { grant_admin_on_register: { data: false, error: null } },
      }),
    )

    const result = await adminSignUp(validForm())

    expect(result).toEqual({
      success: true,
      granted: false,
      error: 'The account was created, but admin access could not be given. Log in and try again.',
    })
  })

  it('refuses to create an account once this connection has made too many recently', async () => {
    vi.mocked(headers).mockResolvedValue(ipHeaders('203.0.113.5'))
    const stub = createSupabaseStub({ rpc: { is_signup_rate_limited: { data: true, error: null } } })
    createClient.mockResolvedValue(stub)

    const result = await adminSignUp(validForm())

    expect(result).toEqual({ error: 'Too many accounts created from this connection recently. Try again in a while.' })
    expect(stub.auth.signUp).not.toHaveBeenCalled()
  })

  it('records the attempt by IP once it clears the rate limit', async () => {
    vi.mocked(headers).mockResolvedValue(ipHeaders('203.0.113.5'))
    const stub = createSupabaseStub({
      rpc: { is_signup_rate_limited: { data: false, error: null }, record_signup_attempt: { data: null, error: null } },
      auth: { signUp: { data: { user: { id: 'admin-1' }, session: null }, error: null } },
      from: { profiles: { error: null } },
    })
    createClient.mockResolvedValue(stub)

    await adminSignUp(validForm())

    expect(stub.rpc).toHaveBeenCalledWith('record_signup_attempt', { p_ip: '203.0.113.5' })
  })
})

describe('claimFirstAdmin', () => {
  it('requires a session', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ user: null }))

    const result = await claimFirstAdmin()

    expect(result).toEqual({ error: 'Your session has expired. Log in again.' })
  })

  it('refuses when the site already has an admin', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'user-1' }, rpc: { claim_first_admin: { data: false, error: null } } }),
    )

    const result = await claimFirstAdmin()

    expect(result).toEqual({ error: 'This site already has an admin. Ask them to add you from the Accounts table.' })
  })

  it('grants the first admin role', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'user-1' }, rpc: { claim_first_admin: { data: true, error: null } } }),
    )

    const result = await claimFirstAdmin()

    expect(result).toEqual({ success: true })
  })
})

describe('setAdmin', () => {
  it('reports success once the database confirms the change', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ rpc: { set_admin: { data: true, error: null } } }))

    expect(await setAdmin('user-1', true)).toEqual({ success: true })
  })

  it('reports failure without a database error when nothing changed', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ rpc: { set_admin: { data: false, error: null } } }))

    expect(await setAdmin('user-1', true)).toEqual({ error: 'That account could not be updated.' })
  })
})

describe('deleteUserAccount', () => {
  it('reports success once the database confirms the deletion', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ rpc: { delete_user_account: { data: true, error: null } } }))

    expect(await deleteUserAccount('user-1')).toEqual({ success: true })
  })

  it('reports failure when the database refuses (e.g. deleting yourself)', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ rpc: { delete_user_account: { data: false, error: null } } }))

    expect(await deleteUserAccount('user-1')).toEqual({ error: 'That account could not be deleted.' })
  })
})

describe('adminSignOut', () => {
  it('signs the session out', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ rpc: { close_login_session: { data: null, error: null } } }))

    expect(await adminSignOut()).toEqual({ success: true })
  })
})

describe('getAccountsOverview', () => {
  it('refuses a non-admin', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'user-1' }, ...adminSessionFixtures({ isAdmin: false }) }),
    )

    const result = await getAccountsOverview()

    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('marks each profile with whether it holds admin access', async () => {
    const session = adminSessionFixtures({ isAdmin: true })
    const stub = createSupabaseStub({
      user: { id: 'admin-1' },
      from: {
        profiles: [
          session.from.profiles,
          {
            data: [
              { id: 'admin-1', full_name: 'Admin One' },
              { id: 'user-2', full_name: 'Regular Buyer' },
            ],
            error: null,
          },
        ],
      },
      rpc: { ...session.rpc, admin_user_ids: { data: ['admin-1'], error: null } },
    })
    createClient.mockResolvedValue(stub)

    const result = await getAccountsOverview()

    expect(result.data).toEqual([
      { id: 'admin-1', full_name: 'Admin One', is_admin: true },
      { id: 'user-2', full_name: 'Regular Buyer', is_admin: false },
    ])
  })
})

describe('getLoginHistory', () => {
  it('refuses a non-admin', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'user-1' }, ...adminSessionFixtures({ isAdmin: false }) }),
    )

    const result = await getLoginHistory('user-2')

    expect(result).toEqual({ error: 'Not authorized' })
  })

  it("returns the target account's recent sessions", async () => {
    const session = adminSessionFixtures({ isAdmin: true })
    const events = [{ id: 'evt-1', signed_in_at: '2026-08-01T00:00:00Z', last_seen_at: null, signed_out_at: null }]
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: 'admin-1' },
        from: { ...session.from, login_events: { data: events, error: null } },
        rpc: session.rpc,
      }),
    )

    const result = await getLoginHistory('user-2')

    expect(result).toEqual({ data: events })
  })
})
