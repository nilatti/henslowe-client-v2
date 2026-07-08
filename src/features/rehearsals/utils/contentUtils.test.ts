import { describe, it, expect } from 'vitest'
import { onStageUserIds, buildCallList, getCalledActors, markContentRecommended } from './contentUtils'
import type { TextUnitWithOnStages } from '../api/rehearsals'
import type { RehearsalUser } from '../types/rehearsal'

function makeUser(id: number, first_name: string): RehearsalUser {
  return { id, first_name, last_name: 'Actor', email: `${first_name}@example.com`, fake: false }
}

function makeContent(id: number, findOnStages: TextUnitWithOnStages['find_on_stages']): TextUnitWithOnStages {
  return { id, number: id, find_on_stages: findOnStages }
}

describe('onStageUserIds', () => {
  it('resolves direct user_id entries', () => {
    const ids = onStageUserIds([{ user_id: 1, character_id: null, character_group_id: null }], new Map())
    expect(ids).toEqual([1])
  })

  it('resolves character_id via characterToUserMap', () => {
    const ids = onStageUserIds(
      [{ user_id: null, character_id: 5, character_group_id: null }],
      new Map([[5, 10]])
    )
    expect(ids).toEqual([10])
  })

  it('resolves character_group_id via characterGroupToUserIdsMap, including multiple actors', () => {
    const ids = onStageUserIds(
      [{ user_id: null, character_id: null, character_group_id: 7 }],
      new Map(),
      new Map([[7, [20, 21]]])
    )
    expect(ids).toEqual([20, 21])
  })

  it('drops a character_group_id with no matching cast entries', () => {
    const ids = onStageUserIds(
      [{ user_id: null, character_id: null, character_group_id: 7 }],
      new Map(),
      new Map()
    )
    expect(ids).toEqual([])
  })
})

describe('buildCallList with character groups', () => {
  it('includes actors cast to a character group on the content', () => {
    const item = makeContent(1, [{ user_id: null, character_id: null, character_group_id: 7 }])
    const actors = [makeUser(20, 'Guard One'), makeUser(21, 'Guard Two')]
    const list = buildCallList(item, actors, new Map(), new Map([[7, [20, 21]]]))
    expect(list).toBe('Guard One Actor, Guard Two Actor')
  })
})

describe('getCalledActors with character groups', () => {
  it('includes group-cast actors across selected content', () => {
    const selected = [makeContent(1, [{ user_id: null, character_id: null, character_group_id: 7 }])]
    const actors = [makeUser(20, 'Guard One')]
    const called = getCalledActors(selected, actors, new Map(), new Map([[7, [20]]]))
    expect(called.map(a => a.id)).toEqual([20])
  })
})

describe('markContentRecommended with character groups', () => {
  it('flags content unrecommended when a group-cast actor is unavailable', () => {
    const playContent = [makeContent(1, [{ user_id: null, character_id: null, character_group_id: 7 }])]
    const unavailable = [makeUser(20, 'Guard One')]
    const result = markContentRecommended(playContent, unavailable, new Map(), new Map([[7, [20]]]))
    expect(result[0].isRecommended).toBe(false)
    expect(result[0].reasonsForRecommendation?.unavailableUsers.map(u => u.id)).toEqual([20])
  })
})
