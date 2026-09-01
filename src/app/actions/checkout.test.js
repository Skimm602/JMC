import { beforeEach, describe, expect, it, vi } from 'vitest'
import { calledWith, createSupabaseStub, fakeFile, fakeFormData } from '@/test/supabaseMock.js'

vi.mock('@/utils/supabase/server', () => ({ createClient: vi.fn() }))
const { createClient } = await import('@/utils/supabase/server')
const { attachPaymentProof, createOrder } = await import('./checkout.js')

const USER = { id: 'user-1', email: 'buyer@example.com' }

const validItems = (overrides = {}) =>
  JSON.stringify([{ productId: 'prod-1', quantity: 2 }].map((i) => ({ ...i, ...overrides })))

const validShipping = JSON.stringify({
  streetAddress: '123 Real St',
  city: 'Ormoc City',
  province: 'Leyte',
  postalCode: '6541',
})

/** The full set of createOrder fields a valid order needs, individually overridable per test. */
function orderForm(overrides = {}) {
  return fakeFormData({
    items: validItems(),
    shipping: validShipping,
    acceptedTerms: 'true',
    phone: '09171234567',
    note: '',
    ...overrides,
  })
}

const product = (overrides = {}) => ({
  id: 'prod-1',
  name: 'HYX-H6K-HS',
  retail_price: '6000.00',
  installer_price: '5400.00',
  stock_quantity: 10,
  ...overrides,
})

beforeEach(() => {
  vi.mocked(createClient).mockReset()
})

describe('createOrder', () => {
  it('refuses an order from a logged-out visitor', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ user: null }))

    const result = await createOrder(orderForm())

    expect(result).toEqual({ error: 'Log in to place an order.' })
  })

  it('refuses an order that has not ticked the no-refund terms', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ user: USER }))

    const result = await createOrder(orderForm({ acceptedTerms: 'false' }))

    expect(result).toEqual({ error: 'Tick the box to confirm the amount and the no-refund terms.' })
  })

  it('requires a callback phone number', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ user: USER }))

    const result = await createOrder(orderForm({ phone: '' }))

    expect(result).toEqual({ error: 'Leave a number we can call to confirm the order.' })
  })

  it('rejects a shipping address missing a required field', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ user: USER }))

    const shipping = JSON.stringify({ streetAddress: '123 Real St', city: '', province: 'Leyte', postalCode: '6541' })
    const result = await createOrder(orderForm({ shipping }))

    expect(result).toEqual({ error: 'Enter the city or municipality.' })
  })

  it('rejects a postal code that is not four digits', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ user: USER }))

    const shipping = JSON.stringify({ streetAddress: '123 Real St', city: 'Ormoc', province: 'Leyte', postalCode: '65A1' })
    const result = await createOrder(orderForm({ shipping }))

    expect(result).toEqual({ error: 'A Philippine ZIP code is four digits.' })
  })

  it('refuses an order with no items', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ user: USER }))

    const result = await createOrder(orderForm({ items: '[]' }))

    expect(result).toEqual({ error: 'There is nothing to order.' })
  })

  it('will not sell more units than are on the shelf', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: USER,
        from: {
          profiles: { data: { customer_type: 'homeowner' }, error: null },
          products: { data: [product({ stock_quantity: 1 })], error: null },
        },
      }),
    )

    const result = await createOrder(orderForm({ items: validItems({ quantity: 2 }) }))

    expect(result).toEqual({ error: 'Only 1 left in stock for HYX-H6K-HS.' })
  })

  it('refuses when a requested product is no longer active or does not exist', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: USER,
        from: {
          profiles: { data: { customer_type: 'homeowner' }, error: null },
          products: { data: [], error: null }, // is_active filter excludes it
        },
      }),
    )

    const result = await createOrder(orderForm())

    expect(result).toEqual({ error: 'One or more items are no longer available.' })
  })

  it('prices a homeowner order at list price, VAT-exclusive in the database row', async () => {
    const stub = createSupabaseStub({
      user: USER,
      from: {
        profiles: { data: { customer_type: 'homeowner' }, error: null },
        products: { data: [product()], error: null },
        orders: { error: null },
        order_items: { error: null },
      },
    })
    createClient.mockResolvedValue(stub)

    const result = await createOrder(orderForm({ items: validItems({ quantity: 2 }) }))

    // 2 x retail_price 6000 = 12000 subtotal, no installer discount, 12% VAT.
    expect(result.success).toBe(true)
    expect(result.total).toBe(13440)

    const orderRow = calledWith(stub, 'orders')
    expect(orderRow.subtotal).toBe(12000)
    expect(orderRow.discount).toBe(0)
    expect(orderRow.vat).toBe(1440)
    expect(orderRow.total).toBe(13440)
    expect(orderRow.status).toBe('pending')
    expect(orderRow.terms_accepted_at).toBeTypeOf('string')
  })

  it('prices an installer order at trade price, ignoring whatever the browser sent', async () => {
    const stub = createSupabaseStub({
      user: USER,
      from: {
        profiles: { data: { customer_type: 'installer' }, error: null },
        products: { data: [product()], error: null },
        orders: { error: null },
        order_items: { error: null },
      },
    })
    createClient.mockResolvedValue(stub)

    const result = await createOrder(orderForm({ items: validItems({ quantity: 2 }) }))

    // 2 x installer_price 5400 = 10800 subtotal, 12% VAT.
    expect(result.total).toBe(12096)
    const orderRow = calledWith(stub, 'orders')
    expect(orderRow.subtotal).toBe(10800)
    expect(orderRow.discount).toBe(1200)
  })

  it('surfaces the database error rather than a generic one when the order insert fails', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: USER,
        from: {
          profiles: { data: { customer_type: 'homeowner' }, error: null },
          products: { data: [product()], error: null },
          orders: { error: { message: 'unique_violation' } },
        },
      }),
    )

    const result = await createOrder(orderForm())

    expect(result).toEqual({ error: 'unique_violation' })
  })

  it('does not silently drop an order whose items fail to save', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: USER,
        from: {
          profiles: { data: { customer_type: 'homeowner' }, error: null },
          products: { data: [product()], error: null },
          orders: { error: null },
          order_items: { error: { message: 'disk full' } },
        },
      }),
    )

    const result = await createOrder(orderForm())

    expect(result.error).toContain('its items failed to save: disk full')
  })
})

describe('attachPaymentProof', () => {
  it('refuses an upload from a logged-out visitor', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ user: null }))

    const result = await attachPaymentProof(fakeFormData({ orderId: 'order-1', proof: fakeFile() }))

    expect(result).toEqual({ error: 'Log in to attach a payment.' })
  })

  it('requires a file to be attached', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ user: USER }))

    const result = await attachPaymentProof(fakeFormData({ orderId: 'order-1', proof: null }))

    expect(result).toEqual({ error: 'Attach a photo or screenshot of the payment.' })
  })

  it('refuses a file over 50MB', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ user: USER }))

    const proof = fakeFile({ size: 51 * 1024 * 1024 })
    const result = await attachPaymentProof(fakeFormData({ orderId: 'order-1', proof }))

    expect(result).toEqual({ error: 'That file is over 50 MB. A screenshot or photo is enough.' })
  })

  it('refuses a file type that is not a photo or a PDF', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ user: USER }))

    const proof = fakeFile({ type: 'video/mp4' })
    const result = await attachPaymentProof(fakeFormData({ orderId: 'order-1', proof }))

    expect(result).toEqual({ error: 'Attach an image or a PDF.' })
  })

  it('tells the customer their order does not exist yet rather than a generic failure', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ user: USER, from: { orders: { data: null, error: null } } }),
    )

    const result = await attachPaymentProof(fakeFormData({ orderId: 'order-1', proof: fakeFile() }))

    expect(result).toEqual({ error: 'That order could not be found.' })
  })

  it('refuses a proof on an order still awaiting the confirmation call', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: USER,
        from: { orders: { data: { id: 'order-1', status: 'pending', payment_proof_path: null }, error: null } },
      }),
    )

    const result = await attachPaymentProof(fakeFormData({ orderId: 'order-1', proof: fakeFile() }))

    expect(result).toEqual({ error: 'This order is still waiting for our confirmation call. We will ask for payment after it.' })
  })

  it('refuses a proof on an order that has moved past approved', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: USER,
        from: { orders: { data: { id: 'order-1', status: 'shipped', payment_proof_path: null }, error: null } },
      }),
    )

    const result = await attachPaymentProof(fakeFormData({ orderId: 'order-1', proof: fakeFile() }))

    expect(result).toEqual({ error: 'This order is past the point where a payment can be attached. Use Customer support.' })
  })

  it('accepts a proof on an approved order and records where it was filed', async () => {
    const stub = createSupabaseStub({
      user: USER,
      from: {
        orders: [
          { data: { id: 'order-1', status: 'approved', payment_proof_path: null }, error: null },
          { error: null }, // the update() that follows
        ],
      },
    })
    createClient.mockResolvedValue(stub)

    const result = await attachPaymentProof(fakeFormData({ orderId: 'order-1', proof: fakeFile() }))

    expect(result).toEqual({ success: true })
    const updateRow = calledWith(stub, 'orders', 1)
    expect(updateRow.payment_proof_path).toMatch(/^user-1\/order-1_\d+\.jpg$/)
    expect(updateRow.payment_proof_uploaded_at).toBeTypeOf('string')
  })

  it('removes the orphaned upload if recording the proof on the order fails', async () => {
    const removeSpy = vi.fn(async () => ({ data: {}, error: null }))
    const stub = createSupabaseStub({
      user: USER,
      from: {
        orders: [
          { data: { id: 'order-1', status: 'approved', payment_proof_path: null }, error: null },
          { error: { message: 'row locked' } },
        ],
      },
    })
    // Swap in a spy for storage.remove so the cleanup call can be asserted on.
    stub.storage.from = vi.fn(() => ({
      upload: vi.fn(async () => ({ data: { path: 'stub' }, error: null })),
      remove: removeSpy,
    }))
    createClient.mockResolvedValue(stub)

    const result = await attachPaymentProof(fakeFormData({ orderId: 'order-1', proof: fakeFile() }))

    expect(result).toEqual({ error: 'row locked' })
    expect(removeSpy).toHaveBeenCalledTimes(1)
  })
})
