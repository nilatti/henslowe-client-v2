import { describe, it, expect } from 'vitest'
import { repackDay } from './reorderUtils'

const r = (id: number, start: string, end: string) => ({
  id,
  start_time: `2026-03-02T${start}:00.000Z`,
  end_time: `2026-03-02T${end}:00.000Z`,
})

// 18:00–19:00, 19:10–19:40, 19:50–21:00 with a 10-minute break
const day = [r(1, '18:00', '19:00'), r(2, '19:10', '19:40'), r(3, '19:50', '21:00')]

describe('repackDay', () => {
  it('moves a later rehearsal to the start and shifts the others later', () => {
    expect(repackDay(day, 2, 0, 10)).toEqual([
      r(3, '18:00', '19:10'),
      r(1, '19:20', '20:20'),
      r(2, '20:30', '21:00'),
    ])
  })

  it('moves an earlier rehearsal down and closes the gap it leaves', () => {
    expect(repackDay(day, 0, 2, 10)).toEqual([
      r(2, '18:00', '18:30'),
      r(3, '18:40', '19:50'),
      r(1, '20:00', '21:00'),
    ])
  })

  it('omits rehearsals whose times do not change', () => {
    expect(repackDay(day, 1, 2, 10)).toEqual([
      r(3, '19:10', '20:20'),
      r(2, '20:30', '21:00'),
    ])
  })

  it('closes existing gaps in the day', () => {
    const gappy = [r(1, '18:00', '19:00'), r(2, '20:00', '21:00')]
    expect(repackDay(gappy, 1, 0, 0)).toEqual([
      r(2, '18:00', '19:00'),
      r(1, '19:00', '20:00'),
    ])
  })

  it('lets the day run later when the break grows the total', () => {
    const tight = [r(1, '18:00', '19:00'), r(2, '19:00', '20:00')]
    expect(repackDay(tight, 1, 0, 15)).toEqual([
      r(2, '18:00', '19:00'),
      r(1, '19:15', '20:15'),
    ])
  })

  it('sorts by start time before applying indexes', () => {
    const unsorted = [day[2], day[0], day[1]]
    expect(repackDay(unsorted, 2, 0, 10)).toEqual(repackDay(day, 2, 0, 10))
  })

  it('returns nothing for a drop in place', () => {
    expect(repackDay(day, 1, 1, 10)).toEqual([])
  })
})
