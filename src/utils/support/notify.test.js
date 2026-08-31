import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The real package unconditionally throws outside Next's server-bundle
// tooling, which isn't present under vitest — this file legitimately only
// ever runs on the server, so the guard itself is what needs stubbing out.
vi.mock('server-only', () => ({}))

const sendMock = vi.fn()
class FakeResend {
  emails = { send: sendMock }
}
vi.mock('resend', () => ({ Resend: FakeResend }))

const { notifyApplicantRejected, notifySupportTeam, supportRecipients } = await import('./notify.js')

beforeEach(() => {
  sendMock.mockReset()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('notifySupportTeam', () => {
  const send = (overrides = {}) =>
    notifySupportTeam({
      name: 'Maria Santos',
      email: 'maria@example.com',
      account: 'maria@example.com',
      subject: 'Order not received',
      message: 'It has been two weeks.',
      recipients: ['owner@example.com'],
      ...overrides,
    })

  it('sends nothing without an API key, and never constructs a client', async () => {
    vi.stubEnv('RESEND_API_KEY', '')

    const result = await send()

    expect(result).toEqual({ ok: false, reason: 'not-configured', delivered: [] })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('sends nothing when there are no admin recipients', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')

    const result = await send({ recipients: [] })

    expect(result).toEqual({ ok: false, reason: 'no-recipients', delivered: [] })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('reports the Resend error rather than throwing', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    sendMock.mockResolvedValue({ data: null, error: { message: 'domain not verified' } })

    const result = await send()

    expect(result).toEqual({ ok: false, reason: 'domain not verified', delivered: [] })
  })

  it('sends to every recipient, replying to the customer, subject prefixed for triage', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    vi.stubEnv('SUPPORT_FROM_EMAIL', 'support@vipsolar.ph')
    sendMock.mockResolvedValue({ data: { id: 'email-1' }, error: null })

    const result = await send({ recipients: ['owner@example.com', 'ops@example.com'] })

    expect(result).toEqual({ ok: true, delivered: ['owner@example.com', 'ops@example.com'], id: 'email-1' })
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'support@vipsolar.ph',
        to: ['owner@example.com', 'ops@example.com'],
        replyTo: 'maria@example.com',
        subject: '[Support] Order not received',
      }),
    )
  })

  it('escapes a customer message before it reaches the HTML body', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    sendMock.mockResolvedValue({ data: { id: 'email-1' }, error: null })

    await send({ message: '<script>alert(1)</script>' })

    const { html } = sendMock.mock.calls[0][0]
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})

describe('notifyApplicantRejected', () => {
  it('sends nothing without an API key', async () => {
    vi.stubEnv('RESEND_API_KEY', '')

    const result = await notifyApplicantRejected({ name: 'Juan', email: 'juan@example.com', reason: 'Expired licence' })

    expect(result).toEqual({ ok: false, reason: 'not-configured' })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('sends nothing when the applicant has no address on file', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')

    const result = await notifyApplicantRejected({ name: 'Juan', email: null, reason: 'Expired licence' })

    expect(result).toEqual({ ok: false, reason: 'no-address' })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('sends the rejection reason to the applicant', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    sendMock.mockResolvedValue({ data: { id: 'email-2' }, error: null })

    const result = await notifyApplicantRejected({ name: 'Juan', email: 'juan@example.com', reason: 'Expired licence' })

    expect(result).toEqual({ ok: true, id: 'email-2' })
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ to: 'juan@example.com' }))
  })
})

describe('supportRecipients', () => {
  it('prefers the SUPPORT_INBOX override and never reads the database', async () => {
    vi.stubEnv('SUPPORT_INBOX', 'owner@example.com, ops@example.com')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await supportRecipients()

    expect(result).toEqual(['owner@example.com', 'ops@example.com'])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('falls back to the admin roster when no override is set', async () => {
    vi.stubEnv('SUPPORT_INBOX', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => [{ email: 'admin1@example.com' }, { email: 'admin2@example.com' }] }),
    )

    const result = await supportRecipients()

    expect(result).toEqual(['admin1@example.com', 'admin2@example.com'])
  })

  it('returns an empty roster rather than throwing when the database read fails', async () => {
    vi.stubEnv('SUPPORT_INBOX', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' }))

    const result = await supportRecipients()

    expect(result).toEqual([])
  })

  it('returns an empty roster without a service key configured', async () => {
    vi.stubEnv('SUPPORT_INBOX', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await supportRecipients()

    expect(result).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
