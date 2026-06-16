import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { upcomingRehearsalsList } from './rehearsalUtils'

const FIXED_NOW = new Date('2026-06-13T10:00:00.000Z')

function makeRehearsal(id: number, offsetDays: number) {
  const start = new Date(FIXED_NOW)
  start.setDate(start.getDate() + offsetDays)
  const end = new Date(start)
  end.setHours(end.getHours() + 2)
  return {
    id,
    production_id: 1,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    space: undefined,
    title: undefined,
    notes: undefined,
    acts: [],
    scenes: [],
    french_scenes: [],
    users: [],
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('upcomingRehearsalsList — default 7-day window', () => {
  it('includes a rehearsal starting today', () => {
    const rows = upcomingRehearsalsList({
      rehearsals: [makeRehearsal(1, 0)],
      playIdByProductionId: new Map(),
    })
    expect(rows).toHaveLength(1)
  })

  it('includes a rehearsal starting 6 days from now', () => {
    const rows = upcomingRehearsalsList({
      rehearsals: [makeRehearsal(1, 6)],
      playIdByProductionId: new Map(),
    })
    expect(rows).toHaveLength(1)
  })

  it('excludes a rehearsal starting 8 days from now', () => {
    const rows = upcomingRehearsalsList({
      rehearsals: [makeRehearsal(1, 8)],
      playIdByProductionId: new Map(),
    })
    expect(rows).toHaveLength(0)
  })

  it('excludes a rehearsal that started 2 days ago', () => {
    const rows = upcomingRehearsalsList({
      rehearsals: [makeRehearsal(1, -2)],
      playIdByProductionId: new Map(),
    })
    expect(rows).toHaveLength(0)
  })

  it('excludes a rehearsal at exactly the 1-day-ago boundary (filter is strict >)', () => {
    const rows = upcomingRehearsalsList({
      rehearsals: [makeRehearsal(1, -1)],
      playIdByProductionId: new Map(),
    })
    expect(rows).toHaveLength(0)
  })
})

describe('upcomingRehearsalsList — dateRangeEnd: null (no cap)', () => {
  it('includes a rehearsal starting today', () => {
    const rows = upcomingRehearsalsList({
      rehearsals: [makeRehearsal(1, 0)],
      playIdByProductionId: new Map(),
      dateRangeEnd: null,
    })
    expect(rows).toHaveLength(1)
  })

  it('includes a rehearsal starting 8 days from now (beyond default 7-day window)', () => {
    const rows = upcomingRehearsalsList({
      rehearsals: [makeRehearsal(1, 8)],
      playIdByProductionId: new Map(),
      dateRangeEnd: null,
    })
    expect(rows).toHaveLength(1)
  })

  it('includes a rehearsal starting 60 days from now', () => {
    const rows = upcomingRehearsalsList({
      rehearsals: [makeRehearsal(1, 60)],
      playIdByProductionId: new Map(),
      dateRangeEnd: null,
    })
    expect(rows).toHaveLength(1)
  })

  it('still excludes a rehearsal that started 2 days ago', () => {
    const rows = upcomingRehearsalsList({
      rehearsals: [makeRehearsal(1, -2)],
      playIdByProductionId: new Map(),
      dateRangeEnd: null,
    })
    expect(rows).toHaveLength(0)
  })

  it('includes a mix of upcoming rehearsals and excludes past ones', () => {
    const rows = upcomingRehearsalsList({
      rehearsals: [
        makeRehearsal(1, -5),
        makeRehearsal(2, 2),
        makeRehearsal(3, 30),
        makeRehearsal(4, 90),
      ],
      playIdByProductionId: new Map(),
      dateRangeEnd: null,
    })
    expect(rows).toHaveLength(3)
  })
})

describe('upcomingRehearsalsList — custom dateRangeEnd', () => {
  it('includes a rehearsal before the specified cutoff', () => {
    const cutoff = new Date(FIXED_NOW)
    cutoff.setDate(cutoff.getDate() + 3)
    const rows = upcomingRehearsalsList({
      rehearsals: [makeRehearsal(1, 2)],
      playIdByProductionId: new Map(),
      dateRangeEnd: cutoff,
    })
    expect(rows).toHaveLength(1)
  })

  it('excludes a rehearsal after the specified cutoff', () => {
    const cutoff = new Date(FIXED_NOW)
    cutoff.setDate(cutoff.getDate() + 3)
    const rows = upcomingRehearsalsList({
      rehearsals: [makeRehearsal(1, 4)],
      playIdByProductionId: new Map(),
      dateRangeEnd: cutoff,
    })
    expect(rows).toHaveLength(0)
  })
})
