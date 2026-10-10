import _ from 'lodash'
import type { TextUnitWithOnStages } from '../api/rehearsals'
import type { RehearsalUser } from '../types/rehearsal'
import { buildUserName, sortUsers } from '../../../utils/actorUtils'
import { pageCount, rehearsalTimeLabel } from './rehearsalMetrics'

export function onStageUserIds(
  findOnStages: { user_id: number | null; character_id: number | null; character_group_id: number | null }[],
  characterToUserMap: Map<number, number>,
  characterGroupToUserIdsMap: Map<number, number[]> = new Map()
): number[] {
  return _.compact(findOnStages.flatMap(os => {
    if (os.user_id != null) return [os.user_id]
    if (os.character_id != null) return [characterToUserMap.get(os.character_id) ?? null]
    if (os.character_group_id != null) return characterGroupToUserIdsMap.get(os.character_group_id) ?? []
    return [null]
  }))
}

type TextUnitRehearsal = NonNullable<TextUnitWithOnStages['rehearsals']>[number]

function withShare(rehearsals: TextUnitRehearsal[] | undefined, share: number): TextUnitRehearsal[] {
  return (rehearsals ?? []).map(r => ({ ...r, share: (r.share ?? 1) * share }))
}

// The fraction of its parent's pages that a text unit makes up, measured
// against its siblings so the shares of a parent's children always sum to 1.
function pageShare(item: TextUnitWithOnStages, siblings: TextUnitWithOnStages[]): number {
  const total = _.sumBy(siblings, s => pageCount(s.start_page, s.end_page))
  return total > 0 ? pageCount(item.start_page, item.end_page) / total : 0
}

// Rehearsal time flows both ways through the act → scene → french scene tree:
// - Up, in full: rehearsing a piece of a text unit still moves the whole unit
//   forward, so a scene counts its french scenes' rehearsals and an act counts
//   its scenes' and french scenes'.
// - Down, prorated by pages: rehearsing a text unit also rehearses each of its
//   parts, so a 10-page scene in a 15-page act is credited 2/3 of each act
//   rehearsal, and each 5-page french scene in that scene 1/3.
export function withInheritedRehearsals(
  items: TextUnitWithOnStages[],
  granularity: 'acts' | 'scenes' | 'french_scenes',
  {
    acts = [],
    scenes = [],
    frenchScenes = [],
  }: {
    acts?: TextUnitWithOnStages[]
    scenes?: TextUnitWithOnStages[]
    frenchScenes?: TextUnitWithOnStages[]
  } = {}
): TextUnitWithOnStages[] {
  const actsById = new Map(acts.map(a => [a.id, a]))
  const scenesById = new Map(scenes.map(s => [s.id, s]))
  const scenesByActId = _.groupBy(scenes, s => s.act_id)
  const frenchScenesBySceneId = _.groupBy(frenchScenes, fs => fs.scene_id)

  // Rehearsals a scene inherits from its act, already scaled to the scene's share.
  const fromAct = (scene: TextUnitWithOnStages): TextUnitRehearsal[] => {
    const act = scene.act_id != null ? actsById.get(scene.act_id) : undefined
    if (!act) return []
    return withShare(act.rehearsals, pageShare(scene, scenesByActId[act.id] ?? []))
  }

  if (granularity === 'french_scenes') {
    return items.map(frenchScene => {
      const scene = frenchScene.scene_id != null ? scenesById.get(frenchScene.scene_id) : undefined
      if (!scene) return frenchScene
      const share = pageShare(frenchScene, frenchScenesBySceneId[scene.id] ?? [])
      return {
        ...frenchScene,
        rehearsals: [
          ...(frenchScene.rehearsals ?? []),
          ...withShare(scene.rehearsals, share),
          ...withShare(fromAct(scene), share),
        ],
      }
    })
  }

  if (granularity === 'scenes') {
    return items.map(scene => ({
      ...scene,
      rehearsals: [
        ...(scene.rehearsals ?? []),
        ...(frenchScenesBySceneId[scene.id] ?? []).flatMap(fs => fs.rehearsals ?? []),
        ...fromAct(scene),
      ],
    }))
  }

  return items.map(act => {
    const childScenes = scenesByActId[act.id] ?? []
    const childFrenchScenes = childScenes.flatMap(s => frenchScenesBySceneId[s.id] ?? [])
    return {
      ...act,
      rehearsals: [
        ...(act.rehearsals ?? []),
        ...childScenes.flatMap(s => s.rehearsals ?? []),
        ...childFrenchScenes.flatMap(fs => fs.rehearsals ?? []),
      ],
    }
  })
}

// Rehearsal time labels for every act, scene and french scene in a play, with
// time inherited up and down the text unit tree as in withInheritedRehearsals.
export function inheritedRehearsalTimeLabels(play: {
  acts?: TextUnitWithOnStages[]
  scenes?: TextUnitWithOnStages[]
  frenchScenes?: TextUnitWithOnStages[]
}): {
  acts: Map<number, string | null>
  scenes: Map<number, string | null>
  frenchScenes: Map<number, string | null>
} {
  const labelsById = (items: TextUnitWithOnStages[] = [], granularity: 'acts' | 'scenes' | 'french_scenes') =>
    new Map(withInheritedRehearsals(items, granularity, play).map(item => [item.id, rehearsalTimeLabel(item)]))
  return {
    acts: labelsById(play.acts, 'acts'),
    scenes: labelsById(play.scenes, 'scenes'),
    frenchScenes: labelsById(play.frenchScenes, 'french_scenes'),
  }
}

export function markContentScheduled(
  playContent: TextUnitWithOnStages[],
  rehearsalContentIds: number[]
): TextUnitWithOnStages[] {
  return playContent.map(item => ({
    ...item,
    isScheduled: rehearsalContentIds.includes(item.id),
  }))
}

export function markContentRecommended(
  playContent: TextUnitWithOnStages[],
  unavailableUsersList: RehearsalUser[],
  characterToUserMap = new Map<number, number>(),
  characterGroupToUserIdsMap = new Map<number, number[]>()
): TextUnitWithOnStages[] {
  const unavailableIds = new Set(unavailableUsersList.map(u => u.id))
  return playContent.map(item => {
    const contentUserIds = onStageUserIds(item.find_on_stages, characterToUserMap, characterGroupToUserIdsMap)
    const conflictingIds = contentUserIds.filter(id => unavailableIds.has(id))
    if (conflictingIds.length > 0) {
      return {
        ...item,
        isRecommended: false,
        reasonsForRecommendation: {
          unavailableUsers: _.compact(
            conflictingIds.map(id => unavailableUsersList.find(u => u.id === id))
          ),
        },
      }
    }
    return { ...item, isRecommended: true, reasonsForRecommendation: { unavailableUsers: [] } }
  })
}

export function buildCallList(
  item: TextUnitWithOnStages,
  actors: RehearsalUser[],
  characterToUserMap = new Map<number, number>(),
  characterGroupToUserIdsMap = new Map<number, number[]>()
): string {
  const userIds = onStageUserIds(item.find_on_stages, characterToUserMap, characterGroupToUserIdsMap)
  const calledActors = _.uniqBy(_.compact(userIds.map(id => actors.find(a => a.id === id))), 'id')
  return sortUsers(calledActors).map(a => buildUserName(a)).join(', ')
}

export function getCalledActors(
  selectedContent: TextUnitWithOnStages[],
  actors: RehearsalUser[],
  characterToUserMap = new Map<number, number>(),
  characterGroupToUserIdsMap = new Map<number, number[]>()
): RehearsalUser[] {
  const userIds = _.uniq(selectedContent.flatMap(item =>
    onStageUserIds(item.find_on_stages, characterToUserMap, characterGroupToUserIdsMap)
  ))
  return _.compact(userIds.map(id => actors.find(a => a.id === id)))
}

export function detectExtraUsers(
  previouslyCalledActors: RehearsalUser[],
  newlyCalledActors: RehearsalUser[]
): RehearsalUser[] {
  const newIds = new Set(newlyCalledActors.map(u => u.id))
  return previouslyCalledActors.filter(u => !newIds.has(u.id))
}

export function buildFinalUserIds(
  calledActors: RehearsalUser[],
  confirmedExtraUsers: RehearsalUser[],
  staffUsers: RehearsalUser[]
): number[] {
  return _.uniq([
    ...calledActors.map(u => u.id),
    ...confirmedExtraUsers.map(u => u.id),
    ...staffUsers.map(u => u.id),
  ])
}
