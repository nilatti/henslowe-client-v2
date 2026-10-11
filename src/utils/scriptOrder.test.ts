import { describe, it, expect } from 'vitest'
import { mergeInPlayOrder, orderFrenchSceneItems, sortByPlayOrder, compareByNumber } from './scriptOrder'

const line = (id: number, number: string, position: number | null = null) => ({ id, number, position })

describe('orderFrenchSceneItems', () => {
  it('sorts by number while the French scene has no positions', () => {
    const items = [line(1, '1.1.10'), line(2, 'SD 1.1.2.1'), line(3, '1.1.2')]
    expect(orderFrenchSceneItems(items).map(i => i.id)).toEqual([3, 2, 1])
  })

  it('sorts by position once the French scene has been reordered, ignoring numbers', () => {
    const items = [line(1, '1.1.1', 3), line(2, '1.1.2', 1), line(3, '1.1.3', 2)]
    expect(orderFrenchSceneItems(items).map(i => i.id)).toEqual([2, 3, 1])
  })

  it('places sound cues by their line_number', () => {
    const items = [line(1, '1.1.1'), { id: 2, line_number: '1.1.1', position: null }, line(3, '1.1.2')]
    expect(orderFrenchSceneItems(items).map(i => i.id)).toEqual([1, 2, 3])
  })
})

describe('mergeInPlayOrder', () => {
  it('keeps French scene order and stamps a play order across types', () => {
    const merged = mergeInPlayOrder([
      { lines: [line(1, '1.1.2', 2)], stage_directions: [line(2, 'SD 1.1.1', 1)], sound_cues: [] },
      // A line moved here from 1.1 keeps its label but follows this French scene's order.
      { lines: [line(3, '2.1.1', 2), line(4, '1.1.5', 1)], stage_directions: [], sound_cues: [] },
    ])
    const all = [...merged.lines, ...merged.stage_directions].sort((a, b) => a._order - b._order)
    expect(all.map(i => i.id)).toEqual([2, 1, 4, 3])
  })

  it('skips empty slots', () => {
    const merged = mergeInPlayOrder([{ lines: [null, line(1, '1.1.1')], stage_directions: null }])
    expect(merged.lines.map(l => l.id)).toEqual([1])
  })
})

describe('sortByPlayOrder', () => {
  it('follows _order when every item has one', () => {
    const items = [{ id: 1, _order: 2 }, { id: 2, _order: 0 }, { id: 3, _order: 1 }]
    expect(sortByPlayOrder(items, () => []).map(i => i.id)).toEqual([2, 3, 1])
  })

  it('falls back when any item lacks _order', () => {
    const items = [line(1, '1.1.2'), line(2, '1.1.1')]
    expect(sortByPlayOrder(items, all => [...all].sort(compareByNumber)).map(i => i.id)).toEqual([2, 1])
  })
})
