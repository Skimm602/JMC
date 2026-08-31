import { beforeEach, describe, expect, it, vi } from 'vitest'
import { calledWith, createSupabaseStub } from '@/test/supabaseMock.js'

vi.mock('@/utils/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/utils/support/notify', () => ({
  notifySupportTeam: vi.fn(async () => ({ ok: true, delivered: ['owner@example.com'], id: 'email-1' })),
  supportRecipients: vi.fn(async () => ['owner@example.com']),
}))

const { createClient } = await import('@/utils/supabase/server')
const { notifySupportTeam } = await import('@/utils/support/notify')
const { sendSupportRequest } = await import('./support.js')

const USER = { id: 'user-1', email: 'buyer@example.com' }

beforeEach(() => {
  vi.mocked(createClient).mockReset()
  vi.mocked(notifySupportTeam).mockClear()
  vi.mocked(notifySupportTeam).mockResolvedValue({ ok: true, delivered: ['owner@example.com'], id: 'email-1' })
})

/** Under the rate limit, with the support_requests table present and writable. */
function happyStub(overrides = {}) {
  return createSupabaseStub({
    user: USER,
    from: {
      support_requests: [{ count: 0, error: null }, { error: null }],
      profiles: { data: { full_name: 'Maria Santos' }, error: null },
    },
    ...overrides,
  })
}

describe('sendSupportRequest', () => {
  it('refuses a logged-out visitor', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ user: null }))

    const result = await sendSupportRequest({ subject: 'Help', message: 'Order has not shipped in two weeks.' })

    expect(result).toEqual({ error: 'Log in first so we know who to reply to.' })
    expect(notifySupportTeam).not.toHaveBeenCalled()
  })

  it('requires a subject', async () => {
    createClient.mockResolvedValue(happyStub())

    const result = await sendSupportRequest({ subject: '  ', message: 'Order has not shipped in two weeks.' })

    expect(result).toEqual({ error: 'Give the request a subject.' })
  })

  it('rejects a subject over the character limit', async () => {
    createClient.mockResolvedValue(happyStub())

    const result = await sendSupportRequest({ subject: 'x'.repeat(121), message: 'Order has not shipped in two weeks.' })

    expect(result.error).toContain('Keep the subject under')
  })

  it('rejects a message that is too short to act on', async () => {
    createClient.mockResolvedValue(happyStub())

    const result = await sendSupportRequest({ subject: 'Help', message: 'short' })

    expect(result).toEqual({ error: 'Tell us a little more about the problem.' })
  })

  it('rejects a message over the character limit', async () => {
    createClient.mockResolvedValue(happyStub())

    const result = await sendSupportRequest({ subject: 'Help', message: 'x'.repeat(4001) })

    expect(result.error).toContain('Keep the message under')
  })

  it('rate-limits after 3 requests in the last 10 minutes', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ user: USER, from: { support_requests: { count: 3, error: null } } }),
    )

    const result = await sendSupportRequest({ subject: 'Help', message: 'Order has not shipped in two weeks.' })

    expect(result).toEqual({ error: 'You have sent 3 requests recently. We will reply to those first.' })
    expect(notifySupportTeam).not.toHaveBeenCalled()
  })

  it('still sends when the support_requests table has not been migrated yet', async () => {
    // 42P01/PGRST205 both mean "the table does not exist" — the count query
    // and the later insert both hit this, and neither should block the email.
    const stub = createSupabaseStub({
      user: USER,
      from: {
        support_requests: [
          { count: null, error: { code: '42P01', message: 'relation does not exist' } },
          { error: { code: '42P01', message: 'relation does not exist' } },
        ],
        profiles: { data: { full_name: 'Maria Santos' }, error: null },
      },
    })
    createClient.mockResolvedValue(stub)

    const result = await sendSupportRequest({ subject: 'Help', message: 'Order has not shipped in two weeks.' })

    expect(result).toEqual({ data: { sent: true } })
    expect(notifySupportTeam).toHaveBeenCalledTimes(1)
  })

  it('sends using the session identity, never the caller-supplied name', async () => {
    const stub = happyStub()
    createClient.mockResolvedValue(stub)

    const result = await sendSupportRequest({ subject: 'Help', message: 'Order has not shipped in two weeks.' })

    expect(result).toEqual({ data: { sent: true } })
    expect(notifySupportTeam).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Maria Santos', email: 'buyer@example.com', account: 'buyer@example.com' }),
    )
    const insertedRow = calledWith(stub, 'support_requests', 1)
    expect(insertedRow.delivered).toBe(true)
  })

  it('gives a generic failure message and still records the attempt when delivery fails', async () => {
    vi.mocked(notifySupportTeam).mockResolvedValue({ ok: false, reason: 'no-recipients', delivered: [] })
    const stub = happyStub()
    createClient.mockResolvedValue(stub)

    const result = await sendSupportRequest({ subject: 'Help', message: 'Order has not shipped in two weeks.' })

    expect(result).toEqual({ error: 'We could not send that just now. Please email jmcsolarph@gmail.com directly.' })
    const insertedRow = calledWith(stub, 'support_requests', 1)
    expect(insertedRow.delivered).toBe(false)
  })
})
