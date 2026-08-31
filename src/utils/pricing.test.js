import { describe, expect, it } from 'vitest'
import { VAT_RATE, formatPeso, hasInstallerPricing, isPriced, quote, unitPriceOf, withVat } from './pricing.js'

const product = (overrides = {}) => ({
  id: 'p1',
  retail_price: '10000.00',
  installer_price: null,
  ...overrides,
})

describe('isPriced', () => {
  it('is false for the "not yet priced" zero convention', () => {
    expect(isPriced(product({ retail_price: '0.00' }))).toBe(false)
  })

  it('is false when retail_price is missing entirely', () => {
    expect(isPriced(product({ retail_price: null }))).toBe(false)
    expect(isPriced({})).toBe(false)
    expect(isPriced(undefined)).toBe(false)
  })

  it('is true for any positive price', () => {
    expect(isPriced(product({ retail_price: '1.00' }))).toBe(true)
    expect(isPriced(product({ retail_price: '99999.99' }))).toBe(true)
  })
})

describe('hasInstallerPricing', () => {
  it('is true only for an installer customer_type', () => {
    expect(hasInstallerPricing({ customer_type: 'installer' })).toBe(true)
    expect(hasInstallerPricing({ customer_type: 'homeowner' })).toBe(false)
    expect(hasInstallerPricing(null)).toBe(false)
  })
})

describe('unitPriceOf', () => {
  it('gives an installer the trade price when one exists', () => {
    const p = product({ retail_price: '10000.00', installer_price: '9000.00' })
    expect(unitPriceOf(p, true)).toBe(9000)
  })

  it('falls back to retail when the product has no installer_price, even for an installer', () => {
    const p = product({ retail_price: '10000.00', installer_price: null })
    expect(unitPriceOf(p, true)).toBe(10000)
  })

  it('never discounts a homeowner even if installer_price is set', () => {
    const p = product({ retail_price: '10000.00', installer_price: '9000.00' })
    expect(unitPriceOf(p, false)).toBe(10000)
  })
})

describe('quote', () => {
  it('prices a single-line homeowner order with no discount', () => {
    const result = quote({ lines: [{ product: product({ retail_price: '10000.00' }), quantity: 1 }] })

    expect(result.retailSubtotal).toBe(10000)
    expect(result.discount).toBe(0)
    expect(result.subtotal).toBe(10000)
    expect(result.vat).toBe(1200)
    expect(result.total).toBe(11200)
  })

  it('applies the trade discount for an installer and still VATs the net price', () => {
    const lines = [{ product: product({ retail_price: '10000.00', installer_price: '9000.00' }), quantity: 1 }]
    const result = quote({ lines, isInstaller: true })

    expect(result.retailSubtotal).toBe(10000)
    expect(result.discount).toBe(1000)
    expect(result.subtotal).toBe(9000)
    expect(result.vat).toBe(1080)
    expect(result.total).toBe(10080)
  })

  it('sums multiple lines and multiple quantities correctly', () => {
    const lines = [
      { product: product({ retail_price: '60000.00' }), quantity: 1 },
      { product: product({ retail_price: '500.00' }), quantity: 3 },
    ]
    const result = quote({ lines })

    expect(result.subtotal).toBe(61500)
    expect(result.vat).toBe(Math.round(61500 * VAT_RATE))
    expect(result.total).toBe(result.subtotal + result.vat)
  })

  it('rounds VAT once on the order total rather than per line, so lines still add up to the whole', () => {
    // Three lines whose individual VAT would each round differently than the
    // VAT on their combined total — this is the scenario the module's own
    // docstring calls out as the reason for centavo-level rounding once, at
    // the end, rather than per line.
    const lines = [
      { product: product({ retail_price: '33.33' }), quantity: 1 },
      { product: product({ retail_price: '33.33' }), quantity: 1 },
      { product: product({ retail_price: '33.34' }), quantity: 1 },
    ]
    const result = quote({ lines })

    expect(result.subtotal).toBe(100)
    expect(result.vat).toBe(Math.round(100 * 100 * VAT_RATE) / 100)
    expect(result.total).toBe(result.subtotal + result.vat)
  })

  it('returns zero totals for an empty order rather than throwing', () => {
    const result = quote({ lines: [] })
    expect(result.subtotal).toBe(0)
    expect(result.vat).toBe(0)
    expect(result.total).toBe(0)
  })
})

describe('withVat', () => {
  it('adds 12% VAT to a VAT-exclusive shelf price', () => {
    expect(withVat(1000)).toBe(1120)
  })
})

describe('formatPeso', () => {
  it('renders a dash for a missing amount rather than ₱0.00', () => {
    expect(formatPeso(null)).toBe('—')
    expect(formatPeso(undefined)).toBe('—')
  })

  it('formats a real amount as PHP currency', () => {
    expect(formatPeso(1234.5)).toContain('1,234.50')
  })
})
