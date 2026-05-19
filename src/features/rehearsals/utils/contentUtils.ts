import _ from 'lodash'
import type { TextUnitWithOnStages } from '../api/rehearsals'
import type { RehearsalUser } from '../types/rehearsal'
import { buildUserName } from '../../../utils/actorUtils'

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
  unavailableUsersList: RehearsalUser[]
): TextUnitWithOnStages[] {
  const unavailableIds = new Set(unavailableUsersList.map(u => u.id))
  return playContent.map(item => {
    const contentUserIds = _.compact(item.find_on_stages.map(os => os.user_id))
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
  actors: RehearsalUser[]
): string {
  const userIds = _.compact(item.find_on_stages.map(os => os.user_id))
  const calledActors = _.compact(userIds.map(id => actors.find(a => a.id === id)))
  return _.uniq(calledActors.map(a => buildUserName(a))).sort().join(', ')
}

export function getCalledActors(
  selectedContent: TextUnitWithOnStages[],
  actors: RehearsalUser[]
): RehearsalUser[] {
  const userIds = _.uniq(
    _.compact(selectedContent.flatMap(item => item.find_on_stages.map(os => os.user_id)))
  )
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
