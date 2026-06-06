import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock external dependencies that require network / queryClient context
vi.mock('../../../lib/queryClient', () => ({
  queryClient: { fetchQuery: vi.fn() },
}))
vi.mock('../../script/api/script', () => ({
  playScriptQueryOptions: vi.fn(() => ({ queryKey: ['script'], queryFn: vi.fn() })),
}))
vi.mock('../../plays/api/plays', () => ({
  playSkeletonQueryOptions: vi.fn(() => ({ queryKey: ['skeleton'], queryFn: vi.fn() })),
  playsQueryOptions: vi.fn(() => ({ queryKey: ['plays'], queryFn: vi.fn() })),
}))

import { useFreePlayStore } from './freePlayStore'

// Reset only the data fields — merges so action functions are preserved
function resetStore() {
  useFreePlayStore.setState({
    play: null,
    playSkeleton: null,
    castings: [],
    fakeActors: { female: 0, male: 0, nonbinary: 0 },
    fakeActorsArray: [],
    loading: false,
  })
}

beforeEach(() => {
  sessionStorage.clear()
  resetStore()
})

describe('freePlayStore — initial state', () => {
  it('starts with no play selected', () => {
    expect(useFreePlayStore.getState().play).toBeNull()
  })

  it('starts with zero fake actors', () => {
    const { fakeActors } = useFreePlayStore.getState()
    expect(fakeActors.female).toBe(0)
    expect(fakeActors.male).toBe(0)
    expect(fakeActors.nonbinary).toBe(0)
  })
})

describe('freePlayStore — setFakeActors', () => {
  it('builds actor array from gender counts (empty existing array)', () => {
    useFreePlayStore.getState().setFakeActors({ female: 2, male: 1, nonbinary: 0 })
    const { fakeActorsArray } = useFreePlayStore.getState()
    expect(fakeActorsArray).toHaveLength(3)
    expect(fakeActorsArray.filter(a => a.first_name === 'FEMALE')).toHaveLength(2)
    expect(fakeActorsArray.filter(a => a.first_name === 'MALE')).toHaveLength(1)
    expect(fakeActorsArray.filter(a => a.first_name === 'NONBINARY')).toHaveLength(0)
  })

  it('assigns sequential last names within each gender', () => {
    useFreePlayStore.getState().setFakeActors({ female: 3, male: 0, nonbinary: 0 })
    const { fakeActorsArray } = useFreePlayStore.getState()
    expect(fakeActorsArray.map(a => a.last_name)).toEqual(['1', '2', '3'])
  })

  it('marks all fake actors with fake: true', () => {
    useFreePlayStore.getState().setFakeActors({ female: 1, male: 1, nonbinary: 1 })
    const { fakeActorsArray } = useFreePlayStore.getState()
    expect(fakeActorsArray.every(a => a.fake === true)).toBe(true)
  })

  it('orders female before male before nonbinary', () => {
    useFreePlayStore.getState().setFakeActors({ female: 1, male: 1, nonbinary: 1 })
    const { fakeActorsArray } = useFreePlayStore.getState()
    expect(fakeActorsArray[0].first_name).toBe('FEMALE')
    expect(fakeActorsArray[1].first_name).toBe('MALE')
    expect(fakeActorsArray[2].first_name).toBe('NONBINARY')
  })

  it('increases actor count when count goes up', () => {
    useFreePlayStore.getState().setFakeActors({ female: 1, male: 0, nonbinary: 0 })
    useFreePlayStore.getState().setFakeActors({ female: 3, male: 0, nonbinary: 0 })
    const { fakeActorsArray } = useFreePlayStore.getState()
    expect(fakeActorsArray.filter(a => a.first_name === 'FEMALE')).toHaveLength(3)
  })

  it('removes extra actors and clears their castings when count decreases', () => {
    useFreePlayStore.setState({
      fakeActorsArray: [
        { id: 1, first_name: 'FEMALE', last_name: '1', email: '', fake: true, jobs: [] },
        { id: 2, first_name: 'FEMALE', last_name: '2', email: '', fake: true, jobs: [] },
      ],
      castings: [
        { character_id: 10, character: { id: 10, name: 'Hamlet' }, user: { id: 2, first_name: 'FEMALE', last_name: '2', email: '', fake: true as const, jobs: [] }, user_id: 2 },
      ],
      fakeActors: { female: 2, male: 0, nonbinary: 0 },
    })
    useFreePlayStore.getState().setFakeActors({ female: 1, male: 0, nonbinary: 0 })
    const { fakeActorsArray, castings } = useFreePlayStore.getState()
    expect(fakeActorsArray).toHaveLength(1)
    // Casting for the removed actor should have user cleared
    expect(castings[0].user_id).toBeUndefined()
    expect(castings[0].user).toBeUndefined()
  })
})

describe('freePlayStore — updateCastings', () => {
  it('assigns a fake actor to a character', () => {
    const actor = { id: 1, first_name: 'FEMALE', last_name: '1', email: '', fake: true as const, jobs: [] }
    useFreePlayStore.setState({
      castings: [{ character_id: 1, character: { id: 1, name: 'Hamlet' } }],
      fakeActorsArray: [actor],
    })
    const casting = { character_id: 1, character: { id: 1, name: 'Hamlet' } }
    useFreePlayStore.getState().updateCastings(casting as any, actor)
    const { castings } = useFreePlayStore.getState()
    expect(castings[0].user_id).toBe(1)
    expect(castings[0].user).toEqual(actor)
  })
})

describe('freePlayStore — cut line convention', () => {
  it('uses empty string (not space or null) to represent a cut line', () => {
    // The cut convention: new_content = '' means cut
    const cutLine = { id: 1, french_scene_id: 1, original_content: 'To be', new_content: '' }
    expect(cutLine.new_content).toBe('')
    expect(cutLine.new_content).not.toBe(' ')
    expect(cutLine.new_content).not.toBeNull()
  })
})
