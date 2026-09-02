import { describe, expect, it } from 'vitest'
import { groupIntoFamilies } from './families.js'

const p = (name, { category = 'accessory', image = null } = {}) => ({
  id: name,
  name,
  category,
  image_url: image ?? `/products/${name}.webp`,
})

/** Same device, photographed once — the second of the two family rules. */
const shot = (name, image, category = 'battery') => p(name, { category, image })

const labels = (cards) => cards.map((c) => c.label)
const sizes = (card) => card.variants.map((v) => v.sizeLabel)

describe('groupIntoFamilies — names carrying a unit', () => {
  it('gathers one breaker in several ratings onto a single card', () => {
    const cards = groupIntoFamilies([p('Easy9 MCB 2P 16 A'), p('Easy9 MCB 2P 20 A'), p('Easy9 MCB 2P 63 A')])

    expect(cards).toHaveLength(1)
    expect(cards[0].isFamily).toBe(true)
    expect(cards[0].label).toBe('Easy9 MCB 2P')
    expect(cards[0].axisLabel).toBe('Rating')
    expect(sizes(cards[0])).toEqual(['16 A', '20 A', '63 A'])
  })

  it('groups on a rating that sits in the middle of the name', () => {
    const cards = groupIntoFamilies([p('Acti9 iC60N 2P 32A C'), p('Acti9 iC60N 2P 63A C')])

    expect(cards[0].label).toBe('Acti9 iC60N 2P C')
    expect(sizes(cards[0])).toEqual(['32 A', '63 A'])
  })

  it('groups inverters on their kW suffix and calls the axis Output', () => {
    const cards = groupIntoFamilies([
      p('S6-EH1P 6K', { category: 'inverter' }),
      p('S6-EH1P 8K', { category: 'inverter' }),
      p('S6-EH1P 12K', { category: 'inverter' }),
      p('S6-EH1P 16K', { category: 'inverter' }),
    ])

    expect(cards).toHaveLength(1)
    expect(cards[0].label).toBe('S6-EH1P')
    expect(cards[0].axisLabel).toBe('Output')
    expect(sizes(cards[0])).toEqual(['6K', '8K', '12K', '16K'])
  })

  it('groups on a suffix buried inside a model code', () => {
    const cards = groupIntoFamilies([
      p('HYX-H6K-HS', { category: 'inverter' }),
      p('HYX-H8K-HS', { category: 'inverter' }),
    ])

    expect(cards[0].label).toBe('HYX-H-HS')
    expect(sizes(cards[0])).toEqual(['6K', '8K'])
  })

  it('does not merge two model lines that differ by more than the size', () => {
    const cards = groupIntoFamilies([
      p('HYX-H6K-HS', { category: 'inverter' }),
      p('HYX-H8K-HS', { category: 'inverter' }),
      p('HYX-H6K-LS', { category: 'inverter' }),
      p('HYX-H8K-LS', { category: 'inverter' }),
    ])

    expect(labels(cards)).toEqual(['HYX-H-HS', 'HYX-H-LS'])
  })

  it('sorts a K suffix as a thousand so mixed units still read low to high', () => {
    const image = '/products/goodwe-es-uniq.png'
    const cards = groupIntoFamilies([
      shot('GW12K-ES-C10', image, 'inverter'),
      shot('GW6000-ES-C10', image, 'inverter'),
    ])

    expect(cards[0].label).toBe('GW-ES-C10')
    expect(sizes(cards[0])).toEqual(['6000', '12K'])
  })
})

describe('groupIntoFamilies — names with no unit', () => {
  it('groups unitless sizes when the shop photographed them once', () => {
    const image = '/products/e50-100-h3.png'
    const cards = groupIntoFamilies([shot('HYX-E50-H3', image), shot('HYX-E100-H3', image)])

    expect(cards).toHaveLength(1)
    expect(cards[0].label).toBe('HYX-E-H3')
    expect(cards[0].axisLabel).toBe('Size')
    expect(sizes(cards[0])).toEqual(['50', '100'])
  })

  it('refuses to merge unitless sizes that were photographed separately', () => {
    // 25.6 V and 51.2 V batteries. One number apart in the name, and nothing
    // alike in the product.
    const cards = groupIntoFamilies([p('LVTS-256100', { category: 'battery' }), p('LVTS-512560', { category: 'battery' })])

    expect(cards).toHaveLength(2)
    expect(cards.every((c) => c.isFamily === false)).toBe(true)
  })

  it('keeps generations apart rather than reading them as a size', () => {
    const cards = groupIntoFamilies([
      p('LVTS-512314-G3', { category: 'battery' }),
      p('LVTS-512314-G4', { category: 'battery' }),
      p('LVTS-512314-G5', { category: 'battery' }),
    ])

    expect(labels(cards)).toEqual(['LVTS-512314-G3', 'LVTS-512314-G4', 'LVTS-512314-G5'])
  })

  it('does not merge a whole range on its one differing number', () => {
    const cards = groupIntoFamilies([
      p('LVTS-512100-G3', { category: 'battery' }),
      p('LVTS-512300-G3', { category: 'battery' }),
      p('LVTS-512314-G3', { category: 'battery' }),
    ])

    expect(cards).toHaveLength(3)
  })

  it('needs a real photograph, not two rows that are both missing one', () => {
    const cards = groupIntoFamilies([
      { id: 'a', name: 'Widget 50 X', category: 'battery', image_url: null },
      { id: 'b', name: 'Widget 100 X', category: 'battery', image_url: null },
    ])

    expect(cards.every((c) => c.isFamily === false)).toBe(true)
  })
})

describe('groupIntoFamilies — what it leaves alone', () => {
  it('never merges across categories', () => {
    const image = '/products/same.webp'
    const cards = groupIntoFamilies([shot('Widget 16 A', image, 'accessory'), shot('Widget 20 A', image, 'battery')])

    expect(cards).toHaveLength(2)
    expect(cards.every((c) => c.isFamily === false)).toBe(true)
  })

  it('leaves a lone sized product as an ordinary card under its full name', () => {
    const cards = groupIntoFamilies([p('Easy9 MCB 2P 16 A')])

    expect(cards[0].isFamily).toBe(false)
    expect(cards[0].label).toBe('Easy9 MCB 2P 16 A')
  })

  it('passes the rest of the catalogue through untouched and in order', () => {
    const rows = [
      p('500W AIO', { category: 'battery' }),
      p('HYX-E160-L', { category: 'battery' }),
      p('LVTS-5220-HVX', { category: 'battery' }),
      p('T-BAT-SYS-LV D150', { category: 'battery' }),
    ]

    const cards = groupIntoFamilies(rows)

    expect(labels(cards)).toEqual(['500W AIO', 'HYX-E160-L', 'LVTS-5220-HVX', 'T-BAT-SYS-LV D150'])
    expect(cards.every((c) => c.isFamily === false)).toBe(true)
  })

  it('does not treat two rows of the same size as a family', () => {
    const image = '/products/same.webp'
    const cards = groupIntoFamilies([shot('Widget 16 A', image), shot('Widget 16 A', image)])

    expect(cards.every((c) => c.isFamily === false)).toBe(true)
  })

  it('puts a family where its first member arrived', () => {
    const cards = groupIntoFamilies([
      p('HYX-E160-L', { category: 'battery' }),
      p('Easy9 MCB 2P 63 A'),
      p('LVTS-512560', { category: 'battery' }),
      p('Easy9 MCB 2P 16 A'),
    ])

    expect(labels(cards)).toEqual(['HYX-E160-L', 'Easy9 MCB 2P', 'LVTS-512560'])
  })

  it('survives an empty or missing list', () => {
    expect(groupIntoFamilies([])).toEqual([])
    expect(groupIntoFamilies(null)).toEqual([])
  })
})
