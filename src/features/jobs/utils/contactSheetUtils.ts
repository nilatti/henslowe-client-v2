import _ from 'lodash'
import { buildUserName } from '../../../utils/actorUtils'
import { getCastings, getStaffJobs } from './jobUtils'
import type { JobWithDetails } from '../types/job'

const CONTACT_SHEET_HEADER = [
  'Name',
  'Pronouns',
  'Job(s)',
  'Email',
  'Phone',
  'Emergency Contact Name',
  'Emergency Contact Phone',
]

function getCharacterGroupCastings(jobs: JobWithDetails[]): JobWithDetails[] {
  return jobs.filter(
    j => j.specialization?.title === 'Actor' && j.character_group_id != null,
  )
}

function jobLabel(job: JobWithDetails): string {
  const title = job.specialization?.title ?? 'Job'
  if (title === 'Actor') {
    const roleName = job.character?.name ?? job.character_group?.name
    return roleName ? `Actor (${roleName})` : 'Actor'
  }
  return title
}

export function buildContactSheetRows(jobs: JobWithDetails[]): string[][] {
  const contactJobs = [
    ...getCastings(jobs),
    ...getCharacterGroupCastings(jobs),
    ...getStaffJobs(jobs),
  ].filter(j => j.user != null && !j.user.fake)

  const byUser = _.groupBy(contactJobs, j => j.user!.id)

  const rows = _.sortBy(
    Object.values(byUser),
    userJobs => userJobs[0].user!.last_name,
    userJobs => userJobs[0].user!.first_name,
    userJobs => userJobs[0].user!.email,
  ).map(userJobs => {
    const user = userJobs[0].user!
    const jobLabels = _.uniq(userJobs.map(jobLabel)).join('; ')
    return [
      buildUserName(user),
      '',
      jobLabels,
      user.email,
      user.phone_number ?? '',
      user.emergency_contact_name ?? '',
      user.emergency_contact_number ?? '',
    ]
  })

  return [CONTACT_SHEET_HEADER, ...rows]
}
