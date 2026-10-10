import { describe, it, expect } from 'vitest'
import { onStageUserIds, buildCallList, getCalledActors, markContentRecommended, withInheritedRehearsals, inheritedRehearsalTimeLabels } from './contentUtils'
import { minutesPerPage, totalRehearsalMinutes } from './rehearsalMetrics'
import type { TextUnitWithOnStages } from '../api/rehearsals'
import type { RehearsalUser } from '../types/rehearsal'

function makeUser(id: number, first_name: string): RehearsalUser {
  return { id, first_name, last_name: 'Actor', email: `${first_name}@example.com`, fake: false }
}

function makeContent(id: number, findOnStages: TextUnitWithOnStages['find_on_stages']): TextUnitWithOnStages {
  return { id, number: id, find_on_stages: findOnStages }
}

function makeRehearsal(startMinute: number, durationMinutes: number) {
  const start = new Date(2024, 0, 1, 0, startMinute)
  const end = new Date(2024, 0, 1, 0, startMinute + durationMinutes)
  return { id: startMinute, start_time: start.toISOString(), end_time: end.toISOString() }
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

describe('withInheritedRehearsals', () => {
  function withPages<T extends TextUnitWithOnStages>(item: T, start_page: number, end_page: number): T {
    return { ...item, start_page, end_page }
  }

  // A 15-page act of three scenes (10, 4 and 1 pages); scene 1 is two 5-page french scenes.
  function buildPlay({ actMinutes = 0, scene1Minutes = 0 } = {}) {
    const act = { ...withPages(makeContent(1, []), 1, 15), rehearsals: actMinutes ? [makeRehearsal(0, actMinutes)] : [] }
    const scenes = [
      { ...withPages(makeContent(10, []), 1, 10), act_id: 1, rehearsals: scene1Minutes ? [makeRehearsal(100, scene1Minutes)] : [] },
      { ...withPages(makeContent(11, []), 11, 14), act_id: 1, rehearsals: [] },
      { ...withPages(makeContent(12, []), 15, 15), act_id: 1, rehearsals: [] },
    ]
    const frenchScenes = [
      { ...withPages(makeContent(20, []), 1, 5), scene_id: 10, rehearsals: [] },
      { ...withPages(makeContent(21, []), 6, 10), scene_id: 10, rehearsals: [] },
      { ...withPages(makeContent(22, []), 11, 14), scene_id: 11, rehearsals: [] },
    ]
    return { acts: [act], scenes, frenchScenes }
  }

  const minutesById = (items: TextUnitWithOnStages[]) =>
    Object.fromEntries(items.map(item => [item.id, totalRehearsalMinutes(item.rehearsals ?? [])]))

  it('leaves french scenes unchanged when no scenes or acts are provided', () => {
    const frenchScenes = [{ ...makeContent(1, []), scene_id: 10, rehearsals: [makeRehearsal(0, 30)] }]
    const [result] = withInheritedRehearsals(frenchScenes, 'french_scenes')
    expect(result.rehearsals).toEqual(frenchScenes[0].rehearsals)
  })

  it('folds a scene\'s french scenes rehearsal time into the scene', () => {
    const scene = { ...makeContent(1, []), rehearsals: [makeRehearsal(0, 60)] }
    const frenchScenes = [
      { ...makeContent(10, []), scene_id: 1, rehearsals: [makeRehearsal(100, 60)] },
      { ...makeContent(11, []), scene_id: 1, rehearsals: [makeRehearsal(200, 60)] },
      { ...makeContent(12, []), scene_id: 2, rehearsals: [makeRehearsal(300, 60)] }, // different scene
    ]
    const [result] = withInheritedRehearsals([scene], 'scenes', { frenchScenes })
    expect(result.rehearsals?.length).toBe(3)
    expect(result.rehearsals?.map(r => r.id).sort()).toEqual([0, 100, 200])
  })

  it('folds scenes and french scenes rehearsal time into an act', () => {
    const act = { ...makeContent(1, []), rehearsals: [makeRehearsal(0, 60)] }
    const scenes = [
      { ...makeContent(10, []), act_id: 1, rehearsals: [makeRehearsal(100, 60)] },
      { ...makeContent(11, []), act_id: 2, rehearsals: [makeRehearsal(200, 60)] }, // different act
    ]
    const frenchScenes = [
      { ...makeContent(20, []), scene_id: 10, rehearsals: [makeRehearsal(300, 60)] },
      { ...makeContent(21, []), scene_id: 11, rehearsals: [makeRehearsal(400, 60)] }, // under other act's scene
    ]
    const [result] = withInheritedRehearsals([act], 'acts', { scenes, frenchScenes })
    expect(result.rehearsals?.map(r => r.id).sort((a, b) => a - b)).toEqual([0, 100, 300])
  })

  it('does not prorate child rehearsal time folded into an act', () => {
    const { acts, scenes, frenchScenes } = buildPlay({ scene1Minutes: 60 })
    expect(minutesById(withInheritedRehearsals(acts, 'acts', { acts, scenes, frenchScenes }))).toEqual({ 1: 60 })
  })

  it('credits each scene with its page share of act rehearsal time', () => {
    const { acts, scenes, frenchScenes } = buildPlay({ actMinutes: 60 })
    const result = withInheritedRehearsals(scenes, 'scenes', { acts, scenes, frenchScenes })
    const minutes = minutesById(result)
    expect(minutes[10]).toBeCloseTo(40) // 10 of 15 pages
    expect(minutes[11]).toBeCloseTo(16) // 4 of 15 pages
    expect(minutes[12]).toBeCloseTo(4) // 1 of 15 pages
    // Every page of the act gets the same per-page credit
    result.forEach(scene => expect(minutesPerPage(scene)).toBeCloseTo(4))
  })

  it('credits each french scene with its page share of act rehearsal time', () => {
    const { acts, scenes, frenchScenes } = buildPlay({ actMinutes: 60 })
    const minutes = minutesById(withInheritedRehearsals(frenchScenes, 'french_scenes', { acts, scenes, frenchScenes }))
    expect(minutes[20]).toBeCloseTo(20) // 1/3 of the act
    expect(minutes[21]).toBeCloseTo(20) // 1/3 of the act
    expect(minutes[22]).toBeCloseTo(16) // all of scene 2's 4/15 share
  })

  it('credits each french scene with its page share of scene rehearsal time', () => {
    const { acts, scenes, frenchScenes } = buildPlay({ scene1Minutes: 60 })
    const minutes = minutesById(withInheritedRehearsals(frenchScenes, 'french_scenes', { acts, scenes, frenchScenes }))
    expect(minutes[20]).toBeCloseTo(30)
    expect(minutes[21]).toBeCloseTo(30)
    expect(minutes[22]).toBe(0) // under a different scene
  })

  it('combines a scene\'s own, inherited and folded-in rehearsal time', () => {
    const { acts, scenes, frenchScenes } = buildPlay({ actMinutes: 60, scene1Minutes: 30 })
    frenchScenes[0] = { ...frenchScenes[0], rehearsals: [makeRehearsal(300, 15)] }
    const minutes = minutesById(withInheritedRehearsals(scenes, 'scenes', { acts, scenes, frenchScenes }))
    expect(minutes[10]).toBeCloseTo(30 + 40 + 15)
  })

  it('combines a french scene\'s own and inherited rehearsal time', () => {
    const { acts, scenes, frenchScenes } = buildPlay({ actMinutes: 60, scene1Minutes: 30 })
    frenchScenes[0] = { ...frenchScenes[0], rehearsals: [makeRehearsal(300, 15)] }
    const minutes = minutesById(withInheritedRehearsals(frenchScenes, 'french_scenes', { acts, scenes, frenchScenes }))
    expect(minutes[20]).toBeCloseTo(15 + 15 + 20) // own + half the scene + a third of the act
    expect(minutes[21]).toBeCloseTo(15 + 20)
  })

  it('splits evenly among children when page numbers are missing', () => {
    const acts = [{ ...makeContent(1, []), rehearsals: [makeRehearsal(0, 60)] }]
    const scenes = [
      { ...makeContent(10, []), act_id: 1, rehearsals: [] },
      { ...makeContent(11, []), act_id: 1, rehearsals: [] },
    ]
    const minutes = minutesById(withInheritedRehearsals(scenes, 'scenes', { acts, scenes }))
    expect(minutes).toEqual({ 10: 30, 11: 30 })
  })
})

describe('inheritedRehearsalTimeLabels', () => {
  it('labels every level of the play with inherited rehearsal time', () => {
    // A 15-page act with an hour of act rehearsal: 4 min/page everywhere,
    // plus 30 extra minutes on 10-page scene 1 (3 min/page for it and its french scenes)
    const act = { ...makeContent(1, []), start_page: 1, end_page: 15, rehearsals: [makeRehearsal(0, 60)] }
    const scenes = [
      { ...makeContent(10, []), start_page: 1, end_page: 10, act_id: 1, rehearsals: [makeRehearsal(100, 30)] },
      { ...makeContent(11, []), start_page: 11, end_page: 15, act_id: 1, rehearsals: [] },
    ]
    const frenchScenes = [
      { ...makeContent(20, []), start_page: 1, end_page: 5, scene_id: 10, rehearsals: [] },
      { ...makeContent(21, []), start_page: 6, end_page: 10, scene_id: 10, rehearsals: [] },
    ]
    const labels = inheritedRehearsalTimeLabels({ acts: [act], scenes, frenchScenes })
    expect(labels.acts.get(1)).toBe('Rehearsal time: 6.0 minutes per page') // 90 min / 15 pages
    expect(labels.scenes.get(10)).toBe('Rehearsal time: 7.0 minutes per page')
    expect(labels.scenes.get(11)).toBe('Rehearsal time: 4.0 minutes per page')
    expect(labels.frenchScenes.get(20)).toBe('Rehearsal time: 7.0 minutes per page')
    expect(labels.frenchScenes.get(21)).toBe('Rehearsal time: 7.0 minutes per page')
  })

  it('returns empty maps while data is loading', () => {
    const labels = inheritedRehearsalTimeLabels({})
    expect(labels.acts.size + labels.scenes.size + labels.frenchScenes.size).toBe(0)
  })
})
