import { vi } from 'vitest'

/**
 * A stand-in for one Supabase query-builder chain.
 *
 * supabase-js's builder is a thenable: every filter method (.select, .eq,
 * .in, .maybeSingle, ...) returns something you can keep chaining OR await
 * directly, and awaiting it at any point resolves to the same { data, error }
 * the call was configured with. This mirrors that shape without knowing which
 * methods a given test's code path happens to call.
 */
export function chain(result) {
  const builder = {}
  const methods = [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'gte',
    'lte',
    'order',
    'limit',
    'maybeSingle',
    'single',
  ]
  for (const name of methods) {
    builder[name] = vi.fn(() => builder)
  }
  builder.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  builder.catch = (reject) => Promise.resolve(result).catch(reject)
  return builder
}

/**
 * A fake supabase client for one server-action call.
 *
 * `from` maps a table name to the { data, error } its query should resolve
 * to — or an array of them, consumed in call order, for an action that
 * queries the same table more than once (e.g. attachPaymentProof reads
 * `orders` then later updates it). `rpc` maps an RPC name the same way.
 *
 * Querying a table or calling an RPC nobody configured throws immediately,
 * so a test that forgets to stub a call it exercises fails loudly at that
 * call site rather than resolving to `undefined` and failing somewhere
 * confusing three lines later.
 */
export function createSupabaseStub({ user = null, auth = {}, from = {}, rpc = {}, storage = {} } = {}) {
  const fromQueues = new Map(
    Object.entries(from).map(([table, results]) => [table, Array.isArray(results) ? [...results] : [results]]),
  )
  const rpcQueues = new Map(
    Object.entries(rpc).map(([name, results]) => [name, Array.isArray(results) ? [...results] : [results]]),
  )

  // Every from() call's own chain is kept, in call order, so a test can go
  // back and inspect what a table was actually queried or written with —
  // e.g. asserting the exact row an insert() was called with — without the
  // stub having to guess in advance what that call will look like.
  const fromCalls = []
  const fromFn = vi.fn((table) => {
    const queue = fromQueues.get(table)
    if (!queue || queue.length === 0) {
      throw new Error(`supabaseMock: unstubbed supabase.from('${table}') call`)
    }
    const builder = chain(queue.length > 1 ? queue.shift() : queue[0])
    fromCalls.push({ table, builder })
    return builder
  })

  const rpcFn = vi.fn((name) => {
    const queue = rpcQueues.get(name)
    if (!queue || queue.length === 0) {
      throw new Error(`supabaseMock: unstubbed supabase.rpc('${name}') call`)
    }
    return chain(queue.length > 1 ? queue.shift() : queue[0])
  })

  const storageFrom = vi.fn(() => ({
    upload: vi.fn(async () => storage.upload ?? { data: { path: 'stub/path' }, error: null }),
    remove: vi.fn(async () => storage.remove ?? { data: {}, error: null }),
    createSignedUrl: vi.fn(async () => storage.createSignedUrl ?? { data: { signedUrl: 'https://signed.example/proof' }, error: null }),
  }))

  // signUp/signInWithPassword must be configured explicitly per test — their
  // shape (data.user, data.session) drives real branching in the callers, so
  // guessing a default would hide exactly the cases worth testing. signOut
  // defaults to a clean success since most flows call it best-effort and
  // only a few tests care what it does.
  const authMethod = (name, defaultResult) =>
    vi.fn(async () => {
      if (name in auth) return auth[name]
      if (defaultResult !== undefined) return defaultResult
      throw new Error(`supabaseMock: unstubbed supabase.auth.${name}() call`)
    })

  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user } })),
      signUp: authMethod('signUp'),
      signInWithPassword: authMethod('signInWithPassword'),
      signOut: authMethod('signOut', { error: null }),
    },
    from: fromFn,
    rpc: rpcFn,
    storage: { from: storageFrom },
    /** Not part of the real client — test-only introspection, see fromCalls above. */
    __fromCalls: fromCalls,
  }
}

/** The row object a given table's insert()/update()/upsert() was called with, for the nth call to that table (default: the first). */
export function calledWith(stub, table, index = 0) {
  const calls = stub.__fromCalls.filter((c) => c.table === table)
  const builder = calls[index]?.builder
  if (!builder) throw new Error(`supabaseMock: no from('${table}') call recorded at index ${index}`)
  const write = builder.insert.mock.calls[0] ?? builder.update.mock.calls[0] ?? builder.upsert.mock.calls[0]
  if (!write) throw new Error(`supabaseMock: from('${table}') was never insert()ed, update()d or upsert()d`)
  return write[0]
}

/** A File-like object good enough for the size/type checks in checkout.js — jsdom is not loaded, so the real File constructor isn't available. */
export function fakeFile({ name = 'proof.jpg', type = 'image/jpeg', size = 1024 } = {}) {
  return { name, type, size }
}

/**
 * A formData-like object with just .get(), for server actions that only
 * ever call that one method. Avoids Node's real FormData, which coerces a
 * fakeFile() into a string instead of keeping it as an object with .size
 * and .type.
 */
export function fakeFormData(values) {
  return { get: (key) => (key in values ? values[key] : null) }
}
