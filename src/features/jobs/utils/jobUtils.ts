import _ from 'lodash'
import type { JobWithDetails, FakeActorCount } from '../types/job'

export function getCastings(jobs: JobWithDetails[]) {
  const filtered = jobs.filter(
    j =>
      j.specialization?.title === 'Actor' &&
      (j.character_id != null || j.character_group_id != null) &&
      !j.character?.name?.match(/Could Not Find Character/)
  )
  return _.sortBy(filtered, j => j.user?.last_name)
}

export function getAuditionerJobs(jobs: JobWithDetails[]) {
  return jobs.filter(j => j.specialization?.title === 'Auditioner')
}

export function getStaffJobs(jobs: JobWithDetails[]) {
  const filtered = jobs.filter(
    j =>
      j.specialization?.title !== 'Actor' &&
      j.specialization?.title !== 'Auditioner'
  )
  return _.sortBy(filtered, j => j.user?.last_name)
}

export function getActors(jobs: JobWithDetails[]) {
  const actingJobs = jobs.filter(j => j.specialization?.title === 'Actor')
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

export interface JobWithSpecialization {
  specialization?: { title: string; department?: { name: string } | null } | null
}

export interface DepartmentJobGroup<T> {
  departmentName: string
  specializations: { title: string; jobs: T[] }[]
}

export function groupJobsByDepartment<T extends JobWithSpecialization>(
  jobs: T[],
  sortJobs: (jobs: T[]) => T[] = jobs => jobs
): DepartmentJobGroup<T>[] {
  const byDept = _.groupBy(jobs, j => j.specialization?.department?.name ?? 'Unassigned')
  return _.sortBy(Object.keys(byDept), name => name).map(departmentName => {
    const bySpec = _.groupBy(byDept[departmentName], j => j.specialization?.title ?? 'Unassigned')
    const specializations = _.sortBy(Object.keys(bySpec), title => title).map(title => ({
      title,
      jobs: sortJobs(bySpec[title]),
    }))
    return { departmentName, specializations }
  })
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
