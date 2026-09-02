import { describe, expect, it } from 'vitest'
import { groupIntoFamilies, ratingLabel, ratingOf } from './families.js'

const product = (name, extra = {}) => ({ id: name, name, category: 'accessory', ...extra })

describe('ratingOf', () => {
  it('reads a spaced ampere token', () => {
    expect(ratingOf(product('Easy9 MCB 2P 16 A'))?.amps).toBe(16)
  })

  it('reads an unspaced ampere token in the middle of a name', () => {
    expect(ratingOf(product('Acti9 iC60N 2P 32A C'))?.amps).toBe(32)
  })

  it('does not mistake a series number for a rating', () => {
    // The 9 in Easy9 and the 60 in iC60N are not followed by an A.
    expect(ratingOf(product('Easy9 MCB'))).toBeNull()
    expect(ratingOf(product('Acti9 iC60N'))).toBeNull()
  })

  it('does not mistake a wattage for a rating', () => {
    expect(ratingOf(product('500W AIO'))).toBeNull()
  })

  it('leaves the rest of the catalogue alone', () => {
    for (const name of ['LVTS-512300-G3', 'HYX-E160-L', 'GEN2-LB-EU 12K', 'S6-EH1P 16K', 'GW12K-ES-C10']) {
      expect(ratingOf(product(name)), name).toBeNull()
    }
  })

  it('refuses a name carrying two ampere tokens rather than guessing', () => {
    expect(ratingOf(product('Breaker 16 A to 63 A'))).toBeNull()
  })

  it('writes every rating the same way whatever the row spells', () => {
    expect(ratingLabel(ratingOf(product('Acti9 iC60N 2P 32A C')).amps)).toBe('32 A')
  })
})

describe('groupIntoFamilies', () => {
  it('gathers one device in several ratings into a single card', () => {
    const rows = [
      product('Easy9 MCB 2P 16 A'),
      product('Easy9 MCB 2P 20 A'),
      product('Easy9 MCB 2P 63 A'),
    ]

    const cards = groupIntoFamilies(rows)

    expect(cards).toHaveLength(1)
    expect(cards[0].isFamily).toBe(true)
    expect(cards[0].label).toBe('Easy9 MCB 2P')
    expect(cards[0].variants.map((v) => v.amps)).toEqual([16, 20, 63])
  })

  it('sorts ratings by number, not by the string they arrived in', () => {
    const rows = [
      product('Easy9 MCB 2P 63 A'),
      product('Easy9 MCB 2P 16 A'),
      product('Easy9 MCB 2P 320 A'),
      product('Easy9 MCB 2P 40 A'),
    ]

    expect(groupIntoFamilies(rows)[0].variants.map((v) => v.amps)).toEqual([16, 40, 63, 320])
  })

  it('keeps the rating out of the family label wherever it sat in the name', () => {
    const cards = groupIntoFamilies([product('Acti9 iC60N 2P 32A C'), product('Acti9 iC60N 2P 63A C')])
    expect(cards[0].label).toBe('Acti9 iC60N 2P C')
  })

  it('does not merge two different devices', () => {
    const cards = groupIntoFamilies([
      product('Easy9 MCB 2P 16 A'),
      product('Easy9 MCB 2P 20 A'),
      product('Acti9 iC60N 2P 32A C'),
      product('Acti9 iC60N 2P 63A C'),
    ])

    expect(cards).toHaveLength(2)
    expect(cards.map((c) => c.label)).toEqual(['Easy9 MCB 2P', 'Acti9 iC60N 2P C'])
  })

  it('never merges across categories', () => {
    const cards = groupIntoFamilies([
      product('Widget 16 A', { category: 'accessory' }),
      product('Widget 20 A', { category: 'battery' }),
    ])

    expect(cards).toHaveLength(2)
    expect(cards.every((c) => c.isFamily === false)).toBe(true)
  })

  it('leaves a lone rated product as an ordinary card under its full name', () => {
    const cards = groupIntoFamilies([product('Easy9 MCB 2P 16 A')])

    expect(cards).toHaveLength(1)
    expect(cards[0].isFamily).toBe(false)
    expect(cards[0].label).toBe('Easy9 MCB 2P 16 A')
  })

  it('passes unrated products through untouched and in order', () => {
    const rows = [product('HYX-E160-L'), product('LVTS-512560'), product('GW12K-ES-C10')]
    const cards = groupIntoFamilies(rows)

    expect(cards.map((c) => c.label)).toEqual(['HYX-E160-L', 'LVTS-512560', 'GW12K-ES-C10'])
    expect(cards.every((c) => c.isFamily === false)).toBe(true)
  })

  it('puts a family where its first member arrived', () => {
    const cards = groupIntoFamilies([
      product('HYX-E160-L'),
      product('Easy9 MCB 2P 63 A'),
      product('LVTS-512560'),
      product('Easy9 MCB 2P 16 A'),
    ])

    expect(cards.map((c) => c.label)).toEqual(['HYX-E160-L', 'Easy9 MCB 2P', 'LVTS-512560'])
  })

  it('survives an empty or missing list', () => {
    expect(groupIntoFamilies([])).toEqual([])
    expect(groupIntoFamilies(null)).toEqual([])
  })
})
