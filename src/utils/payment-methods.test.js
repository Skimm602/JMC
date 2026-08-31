import { describe, expect, it } from 'vitest'
import { GCASH_LIMIT, PAYMENT_METHODS, SMALL_ORDER_LIMIT, methodsFor } from './payment-methods.js'

const idsFor = (total) => methodsFor(total).map((m) => m.id)

describe('PAYMENT_METHODS ordering', () => {
  it('leads with PesoNet as the default, unconditionally-offered method', () => {
    expect(PAYMENT_METHODS[0].id).toBe('pesonet')
    expect(PAYMENT_METHODS[0].maxTotal).toBeNull()
  })
})

describe('methodsFor', () => {
  it('offers everything when there is no total yet (a quoted order)', () => {
    expect(idsFor(null)).toEqual(['pesonet', 'gcash', 'qr_ph'])
    expect(idsFor(0)).toEqual(['pesonet', 'gcash', 'qr_ph'])
    expect(idsFor(undefined)).toEqual(['pesonet', 'gcash', 'qr_ph'])
  })

  it('offers all three below the GCash wallet limit', () => {
    expect(idsFor(GCASH_LIMIT - 1)).toEqual(['pesonet', 'gcash', 'qr_ph'])
    expect(idsFor(GCASH_LIMIT)).toEqual(['pesonet', 'gcash', 'qr_ph'])
  })

  it('drops GCash but keeps QR Ph between the GCash limit and the small-order limit', () => {
    expect(idsFor(GCASH_LIMIT + 1)).toEqual(['pesonet', 'qr_ph'])
    expect(idsFor(SMALL_ORDER_LIMIT)).toEqual(['pesonet', 'qr_ph'])
  })

  it('drops to PesoNet only once the order clears the small-order limit', () => {
    expect(idsFor(SMALL_ORDER_LIMIT + 1)).toEqual(['pesonet'])
    expect(idsFor(100000)).toEqual(['pesonet'])
  })
})
