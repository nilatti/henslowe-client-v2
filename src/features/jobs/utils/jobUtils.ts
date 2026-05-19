import _ from 'lodash'
import type { JobWithDetails, FakeActorCount } from '../types/job'
import {
  ACTOR_SPECIALIZATION_ID,
  AUDITIONER_SPECIALIZATION_ID,
} from '../../../utils/constants'

export function getCastings(jobs: JobWithDetails[]) {
  return jobs.filter(
    j =>
      j.specialization_id === ACTOR_SPECIALIZATION_ID &&
      j.character_id != null &&
      !j.character?.name?.match(/Could Not Find Character/)
  )
}

export function getAuditionerJobs(jobs: JobWithDetails[]) {
  return jobs.filter(
    j => j.specialization_id === AUDITIONER_SPECIALIZATION_ID
  )
}

export function getStaffJobs(jobs: JobWithDetails[]) {
  return jobs.filter(
    j =>
      j.specialization_id !== ACTOR_SPECIALIZATION_ID &&
      j.specialization_id !== AUDITIONER_SPECIALIZATION_ID
  )
}

export function getActors(jobs: JobWithDetails[]) {
  const actingJobs = jobs.filter(
    j => j.specialization_id === ACTOR_SPECIALIZATION_ID
  )
  return _.uniqBy(_.compact(actingJobs.map(j => j.user)), 'id')
}

export function getAuditioners(jobs: JobWithDetails[]) {
  return _.uniqBy(
    _.compact(getAuditionerJobs(jobs).map(j => j.user)),
    'id'
  )
}

export function getActorsAndAuditioners(jobs: JobWithDetails[]) {
  const actors = getActors(jobs)
  const auditioners = getAuditioners(jobs)
  return _.sortBy(_.uniqBy([...actors, ...auditioners], 'id'), [
    'fake',
    'gender',
    'last_name',
  ])
}

export function getFakeActorCount(jobs: JobWithDetails[]): FakeActorCount {
  const fakeActors = getActorsAndAuditioners(jobs).filter(u => u.fake)
  const count: FakeActorCount = { female: 0, male: 0, nonbinary: 0 }
  fakeActors.forEach(a => {
    if (a.gender === 'cis female' || a.gender === 'trans female') {
      count.female++
    } else if (a.gender === 'cis male' || a.gender === 'trans male') {
      count.male++
    } else {
      count.nonbinary++
    }
  })
  return count
}
