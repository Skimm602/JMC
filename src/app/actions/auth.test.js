import { beforeEach, describe, expect, it, vi } from 'vitest'
import { calledWith, createSupabaseStub, fakeFormData } from '@/test/supabaseMock.js'

vi.mock('@/utils/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('next/headers', () => ({ headers: vi.fn() }))
const { createClient } = await import('@/utils/supabase/server')
const { headers } = await import('next/headers')
const { signIn, signOut, signUp } = await import('./auth.js')

/** No IP determinable — the default for every test that isn't specifically
    exercising the signup rate limiter, so clientIp() returns '' and that
    whole check is skipped rather than needing its own RPC stubs everywhere. */
const NO_IP_HEADERS = { get: () => null }

const ipHeaders = (ip) => ({ get: (name) => (name === 'x-forwarded-for' ? ip : null) })

beforeEach(() => {
  vi.mocked(createClient).mockReset()
  vi.mocked(headers).mockReset().mockResolvedValue(NO_IP_HEADERS)
})

describe('signUp', () => {
  const validForm = (overrides = {}) =>
    fakeFormData({
      email: 'homeowner@example.com',
      password: 'hunter22',
      customer_type: 'individual',
      full_name: 'Maria Santos',
      ...overrides,
    })

  it('requires email and password', async () => {
    createClient.mockResolvedValue(createSupabaseStub({}))

    const result = await signUp(validForm({ password: '' }))

    expect(result).toEqual({ error: 'Email and password are required.' })
  })

  it('requires a recognised account type', async () => {
    createClient.mockResolvedValue(createSupabaseStub({}))

    const result = await signUp(validForm({ customer_type: 'business' }))

    expect(result).toEqual({ error: 'Please select an account type.' })
  })

  it('requires a full name', async () => {
    createClient.mockResolvedValue(createSupabaseStub({}))

    const result = await signUp(validForm({ full_name: '' }))

    expect(result).toEqual({ error: 'Full name is required.' })
  })

  it('requires an 8-character password', async () => {
    createClient.mockResolvedValue(createSupabaseStub({}))

    const result = await signUp(validForm({ password: 'short1' }))

    expect(result).toEqual({ error: 'Use at least 8 characters for the password.' })
  })

  it('surfaces an auth signUp error rather than proceeding to create a profile', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ auth: { signUp: { data: null, error: { message: 'Email already registered' } } } }),
    )

    const result = await signUp(validForm())

    expect(result).toEqual({ error: 'Email already registered' })
  })

  it('flags an orphaned auth user rather than hiding a failed profile insert', async () => {
    const stub = createSupabaseStub({
      auth: { signUp: { data: { user: { id: 'new-user-1' }, session: { access_token: 'tok' } }, error: null } },
      from: { profiles: { error: { message: 'check constraint violated' } } },
    })
    createClient.mockResolvedValue(stub)

    const result = await signUp(validForm())

    expect(result.error).toContain('Account created but profile setup failed: check constraint violated')
  })

  it('sends a new homeowner straight to the catalogue as not_required for verification', async () => {
    const stub = createSupabaseStub({
      auth: { signUp: { data: { user: { id: 'new-user-1' }, session: { access_token: 'tok' } }, error: null } },
      from: { profiles: { error: null } },
    })
    createClient.mockResolvedValue(stub)

    const result = await signUp(validForm({ customer_type: 'individual' }))

    expect(result).toEqual({ success: true, hasSession: true, redirectTo: '/products' })
    expect(calledWith(stub, 'profiles').verification_status).toBe('not_required')
  })

  it('sends a new installer to pending verification, unable to buy at trade price yet', async () => {
    const stub = createSupabaseStub({
      auth: { signUp: { data: { user: { id: 'new-user-1' }, session: null }, error: null } },
      from: { profiles: { error: null } },
    })
    createClient.mockResolvedValue(stub)

    const result = await signUp(validForm({ customer_type: 'installer' }))

    expect(result).toEqual({ success: true, hasSession: false, redirectTo: '/installer-status/pending-verification' })
    expect(calledWith(stub, 'profiles').verification_status).toBe('pending')
  })

  it('refuses to create an account once this connection has made too many recently', async () => {
    vi.mocked(headers).mockResolvedValue(ipHeaders('203.0.113.5'))
    const stub = createSupabaseStub({ rpc: { is_signup_rate_limited: { data: true, error: null } } })
    createClient.mockResolvedValue(stub)

    const result = await signUp(validForm())

    expect(result).toEqual({ error: 'Too many accounts created from this connection recently. Try again in a while.' })
    expect(stub.auth.signUp).not.toHaveBeenCalled()
  })

  it('records the attempt by IP once it clears the rate limit', async () => {
    vi.mocked(headers).mockResolvedValue(ipHeaders('203.0.113.5'))
    const stub = createSupabaseStub({
      rpc: { is_signup_rate_limited: { data: false, error: null }, record_signup_attempt: { data: null, error: null } },
      auth: { signUp: { data: { user: { id: 'new-user-1' }, session: { access_token: 'tok' } }, error: null } },
      from: { profiles: { error: null } },
    })
    createClient.mockResolvedValue(stub)

    await signUp(validForm())

    expect(stub.rpc).toHaveBeenCalledWith('record_signup_attempt', { p_ip: '203.0.113.5' })
  })

  it('skips the rate-limit check entirely when no IP can be determined, rather than blocking everyone', async () => {
    // NO_IP_HEADERS is already the beforeEach default — this just asserts
    // signUp() never calls the rate-limit RPCs in that case, since the
    // shared createSupabaseStub would throw on an unstubbed rpc() call if
    // it tried to.
    const stub = createSupabaseStub({
      auth: { signUp: { data: { user: { id: 'new-user-1' }, session: { access_token: 'tok' } }, error: null } },
      from: { profiles: { error: null } },
    })
    createClient.mockResolvedValue(stub)

    const result = await signUp(validForm())

    expect(result.success).toBe(true)
  })
})

describe('signIn', () => {
  const validForm = () => fakeFormData({ email: 'buyer@example.com', password: 'hunter22' })

  /** Every path past the empty-field check now hits the rate-limit gate first. */
  const notLimited = { is_login_rate_limited: { data: false, error: null } }

  it('requires email and password', async () => {
    createClient.mockResolvedValue(createSupabaseStub({}))

    const result = await signIn(fakeFormData({ email: '', password: '' }))

    expect(result).toEqual({ error: 'Email and password are required.' })
  })

  it('refuses to even attempt sign-in once this email has failed too many times', async () => {
    const stub = createSupabaseStub({ rpc: { is_login_rate_limited: { data: true, error: null } } })
    createClient.mockResolvedValue(stub)

    const result = await signIn(validForm())

    expect(result).toEqual({ error: 'Too many attempts on this account. Try again in a few minutes.' })
    expect(stub.auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it('surfaces the auth error on a wrong password, and records the failure', async () => {
    const stub = createSupabaseStub({
      rpc: { ...notLimited, record_login_attempt: { data: null, error: null } },
      auth: { signInWithPassword: { data: null, error: { message: 'Invalid login credentials' } } },
    })
    createClient.mockResolvedValue(stub)

    const result = await signIn(validForm())

    expect(result).toEqual({ error: 'Invalid login credentials' })
    expect(stub.rpc).toHaveBeenCalledWith('record_login_attempt', {
      p_email: 'buyer@example.com',
      p_succeeded: false,
    })
  })

  it('routes an ordinary customer home', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        auth: { signInWithPassword: { data: { user: { id: 'user-1' } }, error: null } },
        rpc: {
          ...notLimited,
          record_login_attempt: { data: null, error: null },
          record_login: { data: null, error: null },
          is_admin: { data: false, error: null },
        },
      }),
    )

    const result = await signIn(validForm())

    expect(result).toEqual({ success: true, isAdmin: false, redirectTo: '/' })
  })

  it('routes an admin account straight to the back office', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        auth: { signInWithPassword: { data: { user: { id: 'admin-1' } }, error: null } },
        rpc: {
          ...notLimited,
          record_login_attempt: { data: null, error: null },
          record_login: { data: null, error: null },
          is_admin: { data: true, error: null },
        },
      }),
    )

    const result = await signIn(validForm())

    expect(result).toEqual({ success: true, isAdmin: true, redirectTo: '/admin' })
  })
})

describe('signOut', () => {
  it('signs the session out', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ rpc: { close_login_session: { data: null, error: null } } }))

    const result = await signOut()

    expect(result).toEqual({ success: true })
  })

  it('surfaces a real sign-out error', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        rpc: { close_login_session: { data: null, error: null } },
        auth: { signOut: { error: { message: 'network error' } } },
      }),
    )

    const result = await signOut()

    expect(result).toEqual({ error: 'network error' })
  })
})
