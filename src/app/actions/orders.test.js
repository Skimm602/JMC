import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseStub } from '@/test/supabaseMock.js'

vi.mock('@/utils/supabase/server', () => ({ createClient: vi.fn() }))
const { createClient } = await import('@/utils/supabase/server')
const {
  getOrders,
  getVatExemptionProofUrl,
  setOrderStatus,
  setOrderTotal,
  setOrderVatExempt,
  updateOrderAddress,
  updateOrderNotes,
  updateOrderTracking,
} = await import('./orders.js')

beforeEach(() => {
  vi.mocked(createClient).mockReset()
})

describe('setOrderStatus', () => {
  it('reports success once the database confirms the transition', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ rpc: { admin_set_order_status: { data: true, error: null } } }),
    )

    const result = await setOrderStatus('order-1', 'processing')

    expect(result).toEqual({ success: true })
  })

  it('reports failure without a database error when the transition was illegal', async () => {
    // admin_set_order_status() returns false rather than erroring when the
    // move from the order's current status is not one NEXT_STATUSES allows.
    createClient.mockResolvedValue(
      createSupabaseStub({ rpc: { admin_set_order_status: { data: false, error: null } } }),
    )

    const result = await setOrderStatus('order-1', 'completed')

    expect(result).toEqual({ error: 'That order could not be updated.' })
  })

  it('passes a real database error straight through', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ rpc: { admin_set_order_status: { data: null, error: { message: 'permission denied' } } } }),
    )

    const result = await setOrderStatus('order-1', 'processing')

    expect(result).toEqual({ error: 'permission denied' })
  })
})

/** readAdminSession() reads a profiles maybeSingle() and rpc('is_admin') in parallel, right after auth.getUser(). */
function adminSessionFixtures({ isAdmin }) {
  return {
    from: { profiles: { data: { full_name: 'Back Office' }, error: null } },
    rpc: { is_admin: { data: isAdmin, error: null } },
  }
}

describe('getOrders', () => {
  it('refuses a non-admin', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'user-1' }, ...adminSessionFixtures({ isAdmin: false }) }),
    )

    const result = await getOrders()

    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('returns an empty list without a further profiles lookup when there are no orders', async () => {
    const session = adminSessionFixtures({ isAdmin: true })
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'admin-1' }, from: { ...session.from, orders: { data: [], error: null } }, rpc: session.rpc }),
    )

    const result = await getOrders()

    expect(result).toEqual({ data: [] })
  })

  it("attaches each order's customer from a separate profiles lookup", async () => {
    const session = adminSessionFixtures({ isAdmin: true })
    const orders = [
      { id: 'order-1', user_id: 'user-1', status: 'paid' },
      { id: 'order-2', user_id: 'user-2', status: 'pending' },
    ]
    const stub = createSupabaseStub({
      user: { id: 'admin-1' },
      from: {
        ...session.from,
        orders: { data: orders, error: null },
        profiles: [
          session.from.profiles,
          {
            data: [
              { id: 'user-1', full_name: 'Maria Santos' },
              { id: 'user-2', full_name: 'Juan Dela Cruz' },
            ],
            error: null,
          },
        ],
      },
      rpc: session.rpc,
    })
    createClient.mockResolvedValue(stub)

    const result = await getOrders()

    expect(result.data[0].customer).toEqual({ id: 'user-1', full_name: 'Maria Santos' })
    expect(result.data[1].customer).toEqual({ id: 'user-2', full_name: 'Juan Dela Cruz' })
  })

  it('passes through a database error on the orders query', async () => {
    const session = adminSessionFixtures({ isAdmin: true })
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: 'admin-1' },
        from: { ...session.from, orders: { data: null, error: { message: 'timeout' } } },
        rpc: session.rpc,
      }),
    )

    const result = await getOrders()

    expect(result).toEqual({ error: 'timeout' })
  })
})

describe('updateOrderAddress', () => {
  const address = { streetAddress: '123 Real St', city: 'Ormoc City', province: 'Leyte', postalCode: '6541' }

  it('reports success once the database confirms the change', async () => {
    const stub = createSupabaseStub({ rpc: { admin_update_order_address: { data: true, error: null } } })
    createClient.mockResolvedValue(stub)

    const result = await updateOrderAddress('order-1', address)

    expect(result).toEqual({ success: true })
    expect(stub.rpc).toHaveBeenCalledWith('admin_update_order_address', {
      p_order_id: 'order-1',
      p_street_address: '123 Real St',
      p_city: 'Ormoc City',
      p_province: 'Leyte',
      p_postal_code: '6541',
    })
  })

  it('reports failure when the database refuses the change', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ rpc: { admin_update_order_address: { data: false, error: null } } }))

    expect(await updateOrderAddress('order-1', address)).toEqual({ error: 'That order could not be updated.' })
  })
})

describe('updateOrderTracking', () => {
  it('reports success once the database confirms the change', async () => {
    const stub = createSupabaseStub({ rpc: { admin_update_order_tracking: { data: true, error: null } } })
    createClient.mockResolvedValue(stub)

    const result = await updateOrderTracking('order-1', { courier: 'LBC', trackingNumber: 'LBC12345' })

    expect(result).toEqual({ success: true })
    expect(stub.rpc).toHaveBeenCalledWith('admin_update_order_tracking', {
      p_order_id: 'order-1',
      p_courier: 'LBC',
      p_tracking_number: 'LBC12345',
    })
  })

  it('passes a real database error through', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ rpc: { admin_update_order_tracking: { data: null, error: { message: 'connection reset' } } } }),
    )

    expect(await updateOrderTracking('order-1', { courier: 'LBC', trackingNumber: '123' })).toEqual({
      error: 'connection reset',
    })
  })
})

describe('updateOrderNotes', () => {
  it('reports success once the database confirms the change', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ rpc: { admin_update_order_notes: { data: true, error: null } } }))

    expect(await updateOrderNotes('order-1', 'Call before delivery')).toEqual({ success: true })
  })
})

describe('setOrderTotal', () => {
  it('rejects a total that is not greater than zero', async () => {
    createClient.mockResolvedValue(createSupabaseStub({}))

    expect(await setOrderTotal('order-1', 0)).toEqual({ error: 'Enter a price greater than zero.' })
    expect(await setOrderTotal('order-1', -500)).toEqual({ error: 'Enter a price greater than zero.' })
    expect(await setOrderTotal('order-1', 'not-a-number')).toEqual({ error: 'Enter a price greater than zero.' })
  })

  it('reports success once the database confirms the price', async () => {
    const stub = createSupabaseStub({ rpc: { admin_set_order_total: { data: true, error: null } } })
    createClient.mockResolvedValue(stub)

    const result = await setOrderTotal('order-1', '55000')

    expect(result).toEqual({ success: true })
    expect(stub.rpc).toHaveBeenCalledWith('admin_set_order_total', { p_order_id: 'order-1', p_subtotal: 55000 })
  })

  it('reports failure once the order is past pending', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ rpc: { admin_set_order_total: { data: false, error: null } } }))

    expect(await setOrderTotal('order-1', 55000)).toEqual({ error: 'That order could not be updated.' })
  })
})

describe('setOrderVatExempt', () => {
  it('reports success once the database confirms the change', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ rpc: { admin_set_order_vat_exempt: { data: true, error: null } } }))

    expect(await setOrderVatExempt('order-1', true)).toEqual({ success: true })
  })

  it('refuses to turn the exemption on with nothing attached to review', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ rpc: { admin_set_order_vat_exempt: { data: false, error: null } } }))

    expect(await setOrderVatExempt('order-1', true)).toEqual({ error: 'That order could not be updated.' })
  })
})

describe('getVatExemptionProofUrl', () => {
  it('refuses a non-admin', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'user-1' }, ...adminSessionFixtures({ isAdmin: false }) }),
    )

    const result = await getVatExemptionProofUrl('order-1')

    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('reports when the order has no exemption document attached', async () => {
    const session = adminSessionFixtures({ isAdmin: true })
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: 'admin-1' },
        from: { ...session.from, orders: { data: { vat_exempt_proof_path: null }, error: null } },
        rpc: session.rpc,
      }),
    )

    const result = await getVatExemptionProofUrl('order-1')

    expect(result).toEqual({ error: 'That order has no VAT-exemption attachment.' })
  })

  it('returns a short-lived signed URL for the admin to review', async () => {
    const session = adminSessionFixtures({ isAdmin: true })
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: 'admin-1' },
        from: { ...session.from, orders: { data: { vat_exempt_proof_path: 'user-1/order-1.jpg' }, error: null } },
        rpc: session.rpc,
        storage: { createSignedUrl: { data: { signedUrl: 'https://signed.example/vat-proof.jpg' }, error: null } },
      }),
    )

    const result = await getVatExemptionProofUrl('order-1')

    expect(result).toEqual({ data: 'https://signed.example/vat-proof.jpg' })
  })
})
