import { beforeEach, describe, expect, it, vi } from 'vitest'
import { calledWith, createSupabaseStub, fakeFile, fakeFormData } from '@/test/supabaseMock.js'

vi.mock('@/utils/supabase/server', () => ({ createClient: vi.fn() }))
const { createClient } = await import('@/utils/supabase/server')
const {
  createProduct,
  deleteProduct,
  getStorefront,
  getStorefrontProduct,
  setProductActive,
  setStock,
  setStockBulk,
  updateProduct,
} = await import('./catalogue.js')

beforeEach(() => {
  vi.mocked(createClient).mockReset()
})

/** readAdminSession() reads a profiles maybeSingle() and rpc('is_admin') in parallel, right after auth.getUser(). */
function adminSessionFixtures({ isAdmin }) {
  return {
    from: { profiles: { data: { full_name: 'Back Office' }, error: null } },
    rpc: { is_admin: { data: isAdmin, error: null } },
  }
}

const activeProducts = [{ id: 'p1', name: 'HYX-H6K-HS', category: 'inverter' }]

describe('getStorefront', () => {
  it("tells an anonymous visitor they are not signed in, without a profile lookup", async () => {
    createClient.mockResolvedValue(createSupabaseStub({ user: null, from: { products: { data: activeProducts, error: null } } }))

    const result = await getStorefront()

    expect(result).toEqual({ data: activeProducts, signedIn: false, isInstaller: false })
  })

  it('shows a signed-in homeowner list prices', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: 'user-1' },
        from: {
          products: { data: activeProducts, error: null },
          profiles: { data: { customer_type: 'homeowner' }, error: null },
        },
      }),
    )

    const result = await getStorefront()

    expect(result).toEqual({ data: activeProducts, signedIn: true, isInstaller: false })
  })

  it('shows a signed-in installer trade prices', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: 'installer-1' },
        from: {
          products: { data: activeProducts, error: null },
          profiles: { data: { customer_type: 'installer' }, error: null },
        },
      }),
    )

    const result = await getStorefront()

    expect(result).toEqual({ data: activeProducts, signedIn: true, isInstaller: true })
  })

  it('narrows the query to one category when asked', async () => {
    const stub = createSupabaseStub({ user: null, from: { products: { data: [], error: null } } })
    createClient.mockResolvedValue(stub)

    await getStorefront('battery')

    const productsCall = stub.__fromCalls.find((c) => c.table === 'products')
    expect(productsCall.builder.eq).toHaveBeenCalledWith('category', 'battery')
  })

  it('still returns the pricing context alongside a query error', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ user: null, from: { products: { data: null, error: { message: 'timeout' } } } }),
    )

    const result = await getStorefront()

    expect(result).toEqual({ error: 'timeout', signedIn: false, isInstaller: false })
  })
})

describe('getStorefrontProduct', () => {
  it('returns null data with no error for an id that is not on sale — a 404, not a failure', async () => {
    createClient.mockResolvedValue(createSupabaseStub({ user: null, from: { products: { data: null, error: null } } }))

    const result = await getStorefrontProduct('prod-1')

    expect(result).toEqual({ data: null, signedIn: false, isInstaller: false })
  })

  it('returns the product for a real, active id', async () => {
    const product = { id: 'prod-1', name: 'HYX-H6K-HS' }
    createClient.mockResolvedValue(createSupabaseStub({ user: null, from: { products: { data: product, error: null } } }))

    const result = await getStorefrontProduct('prod-1')

    expect(result.data).toEqual(product)
  })
})

describe('createProduct', () => {
  const validForm = (overrides = {}) =>
    fakeFormData({
      name: 'HYX-H6K-HS',
      retail_price: '6000',
      installer_price: '5400',
      stock_quantity: '10',
      description: '',
      category: 'inverter',
      voltage_class: 'high',
      ...overrides,
    })

  // readProductFields() calls formData.getAll('specifications'), which the
  // shared fakeFormData() stub does not implement — extend it for these tests.
  const withGetAll = (form) => ({ ...form, getAll: () => [] })

  it('refuses a non-admin', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'user-1' }, ...adminSessionFixtures({ isAdmin: false }) }),
    )

    const result = await createProduct(withGetAll(validForm()))

    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('requires a name', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'admin-1' }, ...adminSessionFixtures({ isAdmin: true }) }),
    )

    const result = await createProduct(withGetAll(validForm({ name: '' })))

    expect(result).toEqual({ error: 'Name is required.' })
  })

  it('rejects an invalid retail price', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'admin-1' }, ...adminSessionFixtures({ isAdmin: true }) }),
    )

    const result = await createProduct(withGetAll(validForm({ retail_price: 'free' })))

    expect(result).toEqual({ error: 'Enter a valid retail price.' })
  })

  it('rejects an invalid category', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'admin-1' }, ...adminSessionFixtures({ isAdmin: true }) }),
    )

    const result = await createProduct(withGetAll(validForm({ category: 'solar-panel' })))

    expect(result).toEqual({ error: 'Type must be inverter, battery or accessory.' })
  })

  it('creates a product with no files, and never calls update() for URLs', async () => {
    const session = adminSessionFixtures({ isAdmin: true })
    const stub = createSupabaseStub({
      user: { id: 'admin-1' },
      from: { ...session.from, products: { data: { id: 'new-prod-1' }, error: null } },
      rpc: session.rpc,
    })
    createClient.mockResolvedValue(stub)

    const result = await createProduct(withGetAll(validForm()))

    expect(result).toEqual({ success: true, id: 'new-prod-1' })
    const productsCalls = stub.__fromCalls.filter((c) => c.table === 'products')
    expect(productsCalls).toHaveLength(1) // insert only — no follow-up update()
  })

  it('uploads an image and saves its URL onto the new row', async () => {
    const session = adminSessionFixtures({ isAdmin: true })
    const stub = createSupabaseStub({
      user: { id: 'admin-1' },
      from: {
        ...session.from,
        products: [{ data: { id: 'new-prod-1' }, error: null }, { error: null }],
      },
      rpc: session.rpc,
    })
    // uploadProductFile() also calls storage.from(bucket).getPublicUrl(path),
    // which the shared stub does not implement — override for this test.
    stub.storage.from = vi.fn(() => ({
      upload: vi.fn(async () => ({ data: { path: 'stub' }, error: null })),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://cdn.example/new-prod-1/image.jpg' } })),
    }))
    createClient.mockResolvedValue(stub)

    const result = await createProduct(withGetAll(validForm({ image: fakeFile({ name: 'unit.jpg' }) })))

    expect(result).toEqual({ success: true, id: 'new-prod-1' })
    const urlUpdate = calledWith(stub, 'products', 1)
    expect(urlUpdate.image_url).toBe('https://cdn.example/new-prod-1/image.jpg')
  })

  it('reports an upload failure without losing the product id it already created', async () => {
    const session = adminSessionFixtures({ isAdmin: true })
    const stub = createSupabaseStub({
      user: { id: 'admin-1' },
      from: { ...session.from, products: { data: { id: 'new-prod-1' }, error: null } },
      rpc: session.rpc,
    })
    stub.storage.from = vi.fn(() => ({
      upload: vi.fn(async () => ({ data: null, error: { message: 'bucket quota exceeded' } })),
    }))
    createClient.mockResolvedValue(stub)

    const result = await createProduct(withGetAll(validForm({ image: fakeFile() })))

    expect(result).toEqual({ error: 'Product was created, but image upload failed: bucket quota exceeded' })
  })
})

describe('updateProduct', () => {
  it('refuses a non-admin', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'user-1' }, ...adminSessionFixtures({ isAdmin: false }) }),
    )

    const result = await updateProduct('prod-1', { get: () => null, getAll: () => [] })

    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('updates the row and reports success', async () => {
    const session = adminSessionFixtures({ isAdmin: true })
    const stub = createSupabaseStub({
      user: { id: 'admin-1' },
      from: { ...session.from, products: { error: null } },
      rpc: session.rpc,
    })
    createClient.mockResolvedValue(stub)

    const form = fakeFormData({ name: 'HYX-H6K-HS', retail_price: '6200', stock_quantity: '8' })
    const result = await updateProduct('prod-1', { ...form, getAll: () => [] })

    expect(result).toEqual({ success: true })
    expect(calledWith(stub, 'products').retail_price).toBe(6200)
  })
})

describe('setStock', () => {
  it('refuses a non-admin', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'user-1' }, ...adminSessionFixtures({ isAdmin: false }) }),
    )

    expect(await setStock('prod-1', 5)).toEqual({ error: 'Not authorized' })
  })

  it('rejects a non-integer or negative count', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'admin-1' }, ...adminSessionFixtures({ isAdmin: true }) }),
    )

    expect(await setStock('prod-1', -1)).toEqual({ error: 'Enter a whole number, zero or more.' })
    expect(await setStock('prod-1', 2.5)).toEqual({ error: 'Enter a whole number, zero or more.' })
  })

  it('sets the shelf count', async () => {
    const session = adminSessionFixtures({ isAdmin: true })
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'admin-1' }, from: { ...session.from, products: { error: null } }, rpc: session.rpc }),
    )

    expect(await setStock('prod-1', 12)).toEqual({ success: true, stock: 12 })
  })
})

describe('setStockBulk', () => {
  it('refuses a non-admin before touching any row', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'user-1' }, ...adminSessionFixtures({ isAdmin: false }) }),
    )

    const result = await setStockBulk([{ id: 'prod-1', stock: 5 }])

    expect(result).toEqual({ error: 'Not authorized' })
  })

  it("does not let one bad row throw away the rest", async () => {
    const session = adminSessionFixtures({ isAdmin: true })
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'admin-1' }, from: { ...session.from, products: { error: null } }, rpc: session.rpc }),
    )

    const result = await setStockBulk([
      { id: 'prod-1', stock: 5 },
      { id: 'prod-2', stock: -1 },
    ])

    expect(result.success).toBe(false)
    expect(result.results).toEqual([
      { id: 'prod-1', success: true, stock: 5 },
      { id: 'prod-2', error: 'Enter a whole number, zero or more.' },
    ])
    expect(result.failed).toEqual([{ id: 'prod-2', error: 'Enter a whole number, zero or more.' }])
  })
})

describe('setProductActive', () => {
  it('refuses a non-admin', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'user-1' }, ...adminSessionFixtures({ isAdmin: false }) }),
    )

    expect(await setProductActive('prod-1', false)).toEqual({ error: 'Not authorized' })
  })

  it('flips the active flag', async () => {
    const session = adminSessionFixtures({ isAdmin: true })
    const stub = createSupabaseStub({
      user: { id: 'admin-1' },
      from: { ...session.from, products: { error: null } },
      rpc: session.rpc,
    })
    createClient.mockResolvedValue(stub)

    const result = await setProductActive('prod-1', false)

    expect(result).toEqual({ success: true })
    expect(calledWith(stub, 'products').is_active).toBe(false)
  })
})

describe('deleteProduct', () => {
  it('refuses a non-admin', async () => {
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'user-1' }, ...adminSessionFixtures({ isAdmin: false }) }),
    )

    expect(await deleteProduct('prod-1')).toEqual({ error: 'Not authorized' })
  })

  it('deletes outright when nothing references the product', async () => {
    const session = adminSessionFixtures({ isAdmin: true })
    createClient.mockResolvedValue(
      createSupabaseStub({ user: { id: 'admin-1' }, from: { ...session.from, products: { error: null } }, rpc: session.rpc }),
    )

    expect(await deleteProduct('prod-1')).toEqual({ success: true, deleted: true })
  })

  it('deactivates instead of deleting when order history references the product', async () => {
    const session = adminSessionFixtures({ isAdmin: true })
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: 'admin-1' },
        from: {
          ...session.from,
          products: [{ error: { code: '23503', message: 'foreign key violation' } }, { error: null }],
        },
        rpc: session.rpc,
      }),
    )

    const result = await deleteProduct('prod-1')

    expect(result).toEqual({ success: true, deactivated: true })
  })

  it('passes through a delete error that is not a foreign-key conflict', async () => {
    const session = adminSessionFixtures({ isAdmin: true })
    createClient.mockResolvedValue(
      createSupabaseStub({
        user: { id: 'admin-1' },
        from: { ...session.from, products: { error: { code: '55000', message: 'connection reset' } } },
        rpc: session.rpc,
      }),
    )

    expect(await deleteProduct('prod-1')).toEqual({ error: 'connection reset' })
  })
})
