import { describe, it, expect } from 'vitest'
import { minutesPerPage } from './rehearsalMetrics'

describe('minutesPerPage', () => {
  it('returns null when rehearsals is undefined', () => {
    expect(minutesPerPage({})).toBeNull()
  })

  it('returns null when rehearsals is empty', () => {
    expect(minutesPerPage({ rehearsals: [] })).toBeNull()
  })

  it('returns null when total rehearsal duration is zero', () => {
    expect(minutesPerPage({
      rehearsals: [{ start_time: '2024-01-01T10:00:00Z', end_time: '2024-01-01T10:00:00Z' }],
    })).toBeNull()
  })

  it('defaults to 1 page when start_page and end_page are null', () => {
    // 60 minutes, 1 page → 60 min/page
    expect(minutesPerPage({
      rehearsals: [{ start_time: '2024-01-01T10:00:00Z', end_time: '2024-01-01T11:00:00Z' }],
      start_page: null,
      end_page: null,
    })).toBe(60)
  })

  it('divides total minutes by page count', () => {
    // 60 minutes over pages 1–3 (3 pages) → 20 min/page
    expect(minutesPerPage({
      rehearsals: [{ start_time: '2024-01-01T10:00:00Z', end_time: '2024-01-01T11:00:00Z' }],
      start_page: 1,
      end_page: 3,
    })).toBe(20)
  })

  it('accumulates minutes across multiple rehearsals', () => {
    // Two 30-min rehearsals = 60 min, 2 pages → 30 min/page
    expect(minutesPerPage({
      rehearsals: [
        { start_time: '2024-01-01T10:00:00Z', end_time: '2024-01-01T10:30:00Z' },
        { start_time: '2024-01-02T10:00:00Z', end_time: '2024-01-02T10:30:00Z' },
      ],
      start_page: 5,
      end_page: 6,
    })).toBe(30)
  })

  it('enforces a minimum page count of 1 when end_page < start_page', () => {
    // malformed data: pageCount returns max(1, ...) = 1
    expect(minutesPerPage({
      rehearsals: [{ start_time: '2024-01-01T10:00:00Z', end_time: '2024-01-01T11:00:00Z' }],
      start_page: 5,
      end_page: 3,
    })).toBe(60)
  })
})
