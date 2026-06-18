import { describe, it, expect } from 'vitest'
import { getConflictedUserIds } from './conflictUtils'
import type { ProductionUserConflict } from '../../rehearsals/api/rehearsals'
import type { RehearsalUser } from '../../rehearsals/types/rehearsal'

// Rehearsal window: 2026-06-18 13:00 UTC → 17:00 UTC
const REHEARSAL_START = new Date('2026-06-18T13:00:00Z')
const REHEARSAL_END = new Date('2026-06-18T17:00:00Z')

function makeUser(id: number): RehearsalUser {
  return { id, first_name: 'A', last_name: 'B', email: 'a@b.com', fake: false }
}

function makeUserConflict(
  userId: number,
  conflictStart: string,
  conflictEnd: string,
  rehearsalId: number | null = null,
): ProductionUserConflict {
  return {
    user: { id: userId, first_name: 'A', last_name: 'B' },
    conflicts: [
      {
        id: 1,
        user_id: userId,
        space_id: null,
        start_time: conflictStart,
        end_time: conflictEnd,
        category: 'personal',
        regular: false,
        conflict_pattern_id: null,
        rehearsal_id: rehearsalId,
        created_at: '',
        updated_at: '',
      },
    ],
  }
}

describe('getConflictedUserIds', () => {
  it('includes a user whose conflict fully overlaps the rehearsal window', () => {
    const users = [makeUser(1)]
    const conflicts = [makeUserConflict(1, '2026-06-18T12:00:00Z', '2026-06-18T18:00:00Z')]
    const result = getConflictedUserIds(users, conflicts, REHEARSAL_START, REHEARSAL_END)
    expect(result.has(1)).toBe(true)
  })

  it('does not include a user whose conflict ends exactly when the rehearsal starts (strict <)', () => {
    const users = [makeUser(1)]
    const conflicts = [makeUserConflict(1, '2026-06-18T11:00:00Z', '2026-06-18T13:00:00Z')]
    const result = getConflictedUserIds(users, conflicts, REHEARSAL_START, REHEARSAL_END)
    expect(result.has(1)).toBe(false)
  })

  it('does not include a user whose conflict starts exactly when the rehearsal ends (strict <)', () => {
    const users = [makeUser(1)]
    const conflicts = [makeUserConflict(1, '2026-06-18T17:00:00Z', '2026-06-18T19:00:00Z')]
    const result = getConflictedUserIds(users, conflicts, REHEARSAL_START, REHEARSAL_END)
    expect(result.has(1)).toBe(false)
  })

  it('does not include a user whose conflict ends 1 minute before the rehearsal starts', () => {
    const users = [makeUser(1)]
    const conflicts = [makeUserConflict(1, '2026-06-18T11:00:00Z', '2026-06-18T12:59:00Z')]
    const result = getConflictedUserIds(users, conflicts, REHEARSAL_START, REHEARSAL_END)
    expect(result.has(1)).toBe(false)
  })

  it('does not include a user whose conflict starts 1 minute after the rehearsal ends', () => {
    const users = [makeUser(1)]
    const conflicts = [makeUserConflict(1, '2026-06-18T17:01:00Z', '2026-06-18T19:00:00Z')]
    const result = getConflictedUserIds(users, conflicts, REHEARSAL_START, REHEARSAL_END)
    expect(result.has(1)).toBe(false)
  })

  it('skips a conflict whose rehearsal_id matches currentRehearsalId, even if it overlaps', () => {
    const users = [makeUser(1)]
    const conflicts = [makeUserConflict(1, '2026-06-18T12:00:00Z', '2026-06-18T18:00:00Z', 42)]
    const result = getConflictedUserIds(users, conflicts, REHEARSAL_START, REHEARSAL_END, 42)
    expect(result.has(1)).toBe(false)
  })

  it('does not include a user who has no conflicts', () => {
    const users = [makeUser(1)]
    const noConflicts: ProductionUserConflict[] = [{ user: { id: 1, first_name: 'A', last_name: 'B' }, conflicts: [] }]
    const result = getConflictedUserIds(users, noConflicts, REHEARSAL_START, REHEARSAL_END)
    expect(result.has(1)).toBe(false)
  })

  it('returns an empty set when the users list is empty', () => {
    const conflicts = [makeUserConflict(1, '2026-06-18T12:00:00Z', '2026-06-18T18:00:00Z')]
    const result = getConflictedUserIds([], conflicts, REHEARSAL_START, REHEARSAL_END)
    expect(result.size).toBe(0)
  })

  it('only includes users from the users list, not every entry in productionUserConflicts', () => {
    // user 2 has a conflict but is not in the users array
    const users = [makeUser(1)]
    const conflicts = [
      makeUserConflict(1, '2026-06-18T14:00:00Z', '2026-06-18T16:00:00Z'),
      makeUserConflict(2, '2026-06-18T14:00:00Z', '2026-06-18T16:00:00Z'),
    ]
    const result = getConflictedUserIds(users, conflicts, REHEARSAL_START, REHEARSAL_END)
    expect(result.has(1)).toBe(true)
    expect(result.has(2)).toBe(false)
  })
})
