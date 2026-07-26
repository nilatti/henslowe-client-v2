import { describe, it, expect } from 'vitest'
import { buildContactSheetRows } from './contactSheetUtils'
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

function user(overrides: Partial<NonNullable<JobWithDetails['user']>>) {
  return {
    id: 1,
    email: 'a@example.com',
    first_name: 'Ann',
    last_name: 'Actor',
    fake: false,
    gender: null,
    ...overrides,
  } as NonNullable<JobWithDetails['user']>
}

describe('buildContactSheetRows', () => {
  it('includes a header row and blank pronouns column', () => {
    const rows = buildContactSheetRows([])
    expect(rows).toEqual([
      ['Name', 'Pronouns', 'Job(s)', 'Email', 'Phone', 'Emergency Contact Name', 'Emergency Contact Phone'],
    ])
  })

  it('labels a character casting with the character name', () => {
    const ann = user({ id: 1, first_name: 'Ann', last_name: 'Actor', email: 'ann@example.com', phone_number: '555-1111', emergency_contact_name: 'Bob', emergency_contact_number: '555-2222' })
    const jobs = [
      job({ id: 1, character_id: 10, character: { id: 10, name: 'Hamlet', new_line_count: null, original_line_count: null }, user: ann, user_id: 1 }),
    ]
    expect(buildContactSheetRows(jobs)).toEqual([
      ['Name', 'Pronouns', 'Job(s)', 'Email', 'Phone', 'Emergency Contact Name', 'Emergency Contact Phone'],
      ['Ann Actor', '', 'Actor (Hamlet)', 'ann@example.com', '555-1111', 'Bob', '555-2222'],
    ])
  })

  it('labels a character-group casting with the group name', () => {
    const ens = user({ id: 2, first_name: 'Ed', last_name: 'Ensemble', email: 'ed@example.com' })
    const jobs = [
      job({ id: 1, character_group_id: 5, character_group: { id: 5, name: 'Townsfolk' }, user: ens, user_id: 2 }),
    ]
    const rows = buildContactSheetRows(jobs)
    expect(rows[1][2]).toEqual('Actor (Townsfolk)')
  })

  it('combines multiple jobs for the same person into one row', () => {
    const sam = user({ id: 3, first_name: 'Sam', last_name: 'Stagehand', email: 'sam@example.com' })
    const jobs = [
      job({
        id: 1,
        character_id: 10,
        character: { id: 10, name: 'Hamlet', new_line_count: null, original_line_count: null },
        user: sam,
        user_id: 3,
      }),
      job({
        id: 2,
        specialization: { id: 2, title: 'Stage Manager', department: null },
        user: sam,
        user_id: 3,
      }),
    ]
    const rows = buildContactSheetRows(jobs)
    expect(rows).toHaveLength(2)
    expect(rows[1][0]).toEqual('Sam Stagehand')
    expect(rows[1][2]).toEqual('Actor (Hamlet); Stage Manager')
  })

  it('excludes auditioners, fake actors, and unfilled jobs', () => {
    const auditioner = user({ id: 4, email: 'auditioner@example.com' })
    const fake = user({ id: 5, email: 'fake@example.com', fake: true })
    const jobs = [
      job({ id: 1, specialization: { id: 3, title: 'Auditioner', department: null }, user: auditioner, user_id: 4 }),
      job({ id: 2, character_id: 11, character: { id: 11, name: 'Ghost', new_line_count: null, original_line_count: null }, user: fake, user_id: 5 }),
      job({ id: 3, specialization: { id: 2, title: 'Director', department: null }, user: null, user_id: null }),
    ]
    expect(buildContactSheetRows(jobs)).toHaveLength(1)
  })
})
