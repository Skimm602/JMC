import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseStub } from '@/test/supabaseMock.js'

vi.mock('@/utils/supabase/server', () => ({ createClient: vi.fn() }))
const { createClient } = await import('@/utils/supabase/server')
const { getAnalyticsOverview, getTrafficOverview } = await import('./analytics.js')

beforeEach(() => {
  vi.mocked(createClient).mockReset()
  // Fixes computeTraffic()'s notion of "today" so a fixture dated 2026-08-15
  // reliably lands on the last day of its 30-day window.
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-08-15T12:00:00+08:00'))
})

afterEach(() => {
  vi.useRealTimers()
})

/**
 * readAdminSession() is called once directly by these actions and again
 * inside getOrders() (getProducts() is public and skips it) — same user,
 * same answer both times, so one non-array fixture per key satisfies both
 * calls. Empty orders keeps getOrders() from making its further profiles
 * lookup, which would need a third fixture.
 */
function adminFixtures({ isAdmin }) {
  return {
    from: { profiles: { data: { full_name: 'Back Office' }, error: null }, orders: { data: [], error: null }, products: { data: [], error: null } },
    rpc: { is_admin: { data: isAdmin, error: null } },
  }
}

describe('getAnalyticsOverview', () => {
  it('refuses a non-admin', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: 'user-1' },
        from: { profiles: { data: { full_name: 'x' }, error: null } },
        rpc: { is_admin: { data: false, error: null } },
      }),
    )

    const result = await getAnalyticsOverview()

    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('reads the same getOrders()/getProducts() the Orders and Maintenance tabs use', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ user: { id: 'admin-1' }, ...adminFixtures({ isAdmin: true }) }))

    const result = await getAnalyticsOverview()

    expect(result.data.totals.revenue).toBe(0)
    expect(result.data.lowStock).toEqual([])
  })
})

describe('getTrafficOverview', () => {
  it('refuses a non-admin', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: 'user-1' },
        from: { profiles: { data: { full_name: 'x' }, error: null } },
        rpc: { is_admin: { data: false, error: null } },
      }),
    )

    const result = await getTrafficOverview()

    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('reports notInstalled rather than a raw Postgres error when the page-view counter has never been set up', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: 'admin-1' },
        from: { profiles: { data: { full_name: 'x' }, error: null } },
        rpc: {
          is_admin: { data: true, error: null },
          admin_page_view_daily: { data: null, error: { code: 'PGRST202', message: 'could not find the function' } },
        },
      }),
    )

    const result = await getTrafficOverview()

    expect(result).toEqual({ notInstalled: true })
  })

  it('surfaces a real database error normally', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: 'admin-1' },
        from: { profiles: { data: { full_name: 'x' }, error: null } },
        rpc: {
          is_admin: { data: true, error: null },
          admin_page_view_daily: { data: null, error: { code: '55000', message: 'connection reset' } },
        },
      }),
    )

    const result = await getTrafficOverview()

    expect(result).toEqual({ error: 'connection reset' })
  })

  it('computes the traffic series on success', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: 'admin-1' },
        from: { profiles: { data: { full_name: 'x' }, error: null } },
        rpc: {
          is_admin: { data: true, error: null },
          admin_page_view_daily: { data: [{ viewed_on: '2026-08-15', visitors: 4, views: 9 }], error: null },
        },
      }),
    )

    const result = await getTrafficOverview()

    expect(result.data.daily.at(-1)).toMatchObject({ visitors: 4, views: 9 })
  })
})
