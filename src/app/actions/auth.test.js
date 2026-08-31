import { beforeEach, describe, expect, it, vi } from 'vitest'
import { calledWith, createSupabaseStub, fakeFormData } from '@/test/supabaseMock.js'

vi.mock('@/utils/supabase/server', () => ({ createClient: vi.fn() }))
const { createClient } = await import('@/utils/supabase/server')
const { signIn, signOut, signUp } = await import('./auth.js')

beforeEach(() => {
  vi.mocked(createClient).mockReset()
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
})

describe('signIn', () => {
  const validForm = () => fakeFormData({ email: 'buyer@example.com', password: 'hunter22' })

  it('requires email and password', async () => {
    createClient.mockResolvedValue(createSupabaseStub({}))

    const result = await signIn(fakeFormData({ email: '', password: '' }))

    expect(result).toEqual({ error: 'Email and password are required.' })
  })

  it('surfaces the auth error on a wrong password', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ auth: { signInWithPassword: { data: null, error: { message: 'Invalid login credentials' } } } }),
    )

    const result = await signIn(validForm())

    expect(result).toEqual({ error: 'Invalid login credentials' })
  })

  it('routes an ordinary customer home', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        auth: { signInWithPassword: { data: { user: { id: 'user-1' } }, error: null } },
        rpc: { record_login: { data: null, error: null }, is_admin: { data: false, error: null } },
      }),
    )

    const result = await signIn(validForm())

    expect(result).toEqual({ success: true, isAdmin: false, redirectTo: '/' })
  })

  it('routes an admin account straight to the back office', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        auth: { signInWithPassword: { data: { user: { id: 'admin-1' } }, error: null } },
        rpc: { record_login: { data: null, error: null }, is_admin: { data: true, error: null } },
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
