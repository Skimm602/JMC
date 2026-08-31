import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseStub } from '@/test/supabaseMock.js'

vi.mock('@/utils/supabase/server', () => ({ createClient: vi.fn() }))
const { createClient } = await import('@/utils/supabase/server')
const { getMyOrders } = await import('./account.js')

beforeEach(() => {
  vi.mocked(createClient).mockReset()
})

describe('getMyOrders', () => {
  it('refuses a logged-out visitor', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ user: null }))

    const result = await getMyOrders()

    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns the signed-in customer their own orders', async () => {
    const orders = [{ id: 'order-1', status: 'shipped', total: 11200 }]
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'user-1' }, from: { orders: { data: orders, error: null } } }),
    )

    const result = await getMyOrders()

    expect(result).toEqual({ data: orders })
  })

  it('passes through a database error rather than hiding it', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'user-1' }, from: { orders: { data: null, error: { message: 'timeout' } } } }),
    )

    const result = await getMyOrders()

    expect(result).toEqual({ error: 'timeout' })
  })
})
