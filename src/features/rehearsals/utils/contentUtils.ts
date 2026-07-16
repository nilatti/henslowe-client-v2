import _ from 'lodash'
import type { TextUnitWithOnStages } from '../api/rehearsals'
import type { RehearsalUser } from '../types/rehearsal'
import { buildUserName, sortUsers } from '../../../utils/actorUtils'

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

// A scene's rehearsal time also counts time spent rehearsing its french scenes,
// and an act's also counts time spent on its scenes and their french scenes —
// rehearsing a piece of a text unit still moves the whole unit forward.
export function withInheritedRehearsals(
  items: TextUnitWithOnStages[],
  granularity: 'acts' | 'scenes' | 'french_scenes',
  scenes: TextUnitWithOnStages[] = [],
  frenchScenes: TextUnitWithOnStages[] = []
): TextUnitWithOnStages[] {
  if (granularity === 'french_scenes') return items

  if (granularity === 'scenes') {
    return items.map(scene => ({
      ...scene,
      rehearsals: [
        ...(scene.rehearsals ?? []),
        ...frenchScenes.filter(fs => fs.scene_id === scene.id).flatMap(fs => fs.rehearsals ?? []),
      ],
    }))
  }

  return items.map(act => {
    const childScenes = scenes.filter(s => s.act_id === act.id)
    const childSceneIds = new Set(childScenes.map(s => s.id))
    const childFrenchScenes = frenchScenes.filter(
      fs => fs.scene_id != null && childSceneIds.has(fs.scene_id)
    )
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
