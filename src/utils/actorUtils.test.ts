import { describe, it, expect } from 'vitest'
import { buildUserName, sortUsers } from './actorUtils'
import type { User } from './actorUtils'

describe('buildUserName', () => {
  it('uses preferred_name when available', () => {
    const user: User = { id: 1, email: 'j@test.com', first_name: 'John', last_name: 'Smith', preferred_name: 'Johnny' }
    expect(buildUserName(user)).toBe('Johnny Smith')
  })

  it('falls back to first_name when preferred_name is null', () => {
    const user: User = { id: 1, email: 'j@test.com', first_name: 'John', last_name: 'Smith', preferred_name: null }
    expect(buildUserName(user)).toBe('John Smith')
  })

  it('falls back to email for both parts when names are absent', () => {
    const user: User = { id: 1, email: 'j@test.com' }
    expect(buildUserName(user)).toBe('j@test.com j@test.com')
  })

  it('uses email as first part when first_name is absent', () => {
    const user: User = { id: 1, email: 'j@test.com', last_name: 'Smith' }
    expect(buildUserName(user)).toContain('j@test.com')
  })

  it('uses email as last part when last_name is absent', () => {
    const user: User = { id: 1, email: 'j@test.com', first_name: 'John' }
    expect(buildUserName(user)).toContain('John')
    expect(buildUserName(user)).toContain('j@test.com')
  })
})

describe('sortUsers', () => {
  it('sorts by last name then first name', () => {
    const users: User[] = [
      { id: 1, email: 'a@test.com', first_name: 'Zara', last_name: 'Adams' },
      { id: 2, email: 'b@test.com', first_name: 'Alice', last_name: 'Zane' },
      { id: 3, email: 'c@test.com', first_name: 'Bob', last_name: 'Adams' },
    ]
    const sorted = sortUsers(users)
    expect(sorted[0].last_name).toBe('Adams')
    expect(sorted[0].first_name).toBe('Bob')
    expect(sorted[1].last_name).toBe('Adams')
    expect(sorted[1].first_name).toBe('Zara')
    expect(sorted[2].last_name).toBe('Zane')
  })

  it('returns empty array unchanged', () => {
    expect(sortUsers([])).toEqual([])
  })
})
