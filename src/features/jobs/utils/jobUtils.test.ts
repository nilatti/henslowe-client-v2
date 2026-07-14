import { describe, it, expect } from 'vitest'
import { getCastings } from './jobUtils'
import type { JobWithDetails } from '../types/job'

function job(overrides: Partial<JobWithDetails>): JobWithDetails {
  return {
    id: overrides.id ?? 1,
    production_id: 1,
    theater_id: null,
    user_id: null,
    specialization_id: null,
    character_id: null,
    character_group_id: null,
    start_date: null,
    end_date: null,
    created_at: '',
    updated_at: '',
    specialization: { id: 1, title: 'Actor', department: null },
    theater: null,
    character: null,
    character_group: null,
    production: null,
    user: null,
    audition_submission: null,
    ...overrides,
  }
}

describe('getCastings', () => {
  it('excludes jobs that only have a character_group_id (no character_id)', () => {
    const groupJob = job({ id: 1, character_group_id: 5, character: null })
    const charJob = job({ id: 2, character_id: 10, character: { id: 10, name: 'Hamlet', new_line_count: null, original_line_count: null } })
    expect(getCastings([groupJob, charJob])).toEqual([charJob])
  })

  it('sorts by character name', () => {
    const zed = job({ id: 1, character_id: 1, character: { id: 1, name: 'Zed', new_line_count: null, original_line_count: null } })
    const anna = job({ id: 2, character_id: 2, character: { id: 2, name: 'Anna', new_line_count: null, original_line_count: null } })
    expect(getCastings([zed, anna]).map(j => j.id)).toEqual([2, 1])
  })
})
