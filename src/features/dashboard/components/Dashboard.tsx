import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { isAfter, isBefore, parseISO } from 'date-fns'
import { useAuth } from '../../../hooks/useAuth'
import { buildUserName } from '../../../utils/actorUtils'
import { upcomingRehearsalsList } from '../../../utils/rehearsalUtils'
import { ConflictsManager } from '../../conflicts/components/ConflictsManager'
import { userDashboardQueryOptions } from '../api/dashboard'

export function Dashboard() {
  const { user } = useAuth()
  const { data } = useSuspenseQuery(userDashboardQueryOptions(user!.id))

  const now = new Date()

  const auditionerJobs = data.jobs.filter((j) => j.specialization?.title === 'Auditioner')
  const otherJobs = data.jobs.filter((j) => j.specialization?.title !== 'Auditioner')

  const currentProductions = otherJobs
    // TODO: date filter also available for jobs list — see commented filter below
    .filter(
      (job) =>
        job.production &&
        job.start_date &&
        job.end_date &&
        isBefore(parseISO(job.start_date), now) &&
        isAfter(parseISO(job.end_date), now),
    )
    .map((job) => job.production!)

  const playIdByProductionId = new Map(
    otherJobs
      .filter((j) => j.production?.play)
      .map((j) => [j.production!.id, j.production!.play!.id])
  )

  const rehearsals = upcomingRehearsalsList({
    rehearsals: data.rehearsals ?? [],
    playIdByProductionId,
  })

  return (
    <div>
      <h3 className="pt-4 text-xl font-semibold">Welcome, {buildUserName(data)}!</h3>

      <div>
        <h4 className="pt-4 text-lg font-medium">Current Jobs &amp; Productions</h4>
        {otherJobs.length > 0 ? (
          <ul className="list-disc list-inside space-y-1">
            {otherJobs
              // TODO: filter by date range:
              // .filter(job =>
              //   job.start_date && job.end_date &&
              //   isBefore(parseISO(job.start_date), now) &&
              //   isAfter(parseISO(job.end_date), now)
              // )
              .map((job) => (
                <li key={job.id}>
                  {job.specialization?.title}{' '}
                  {job.production && (
                    <span>
                      on{' '}
                      <Link
                        to="/productions/$productionId"
                        params={{ productionId: String(job.production.id) }}
                        className="text-blue-600 hover:underline"
                      >
                        {job.production.play?.title}
                      </Link>{' '}
                    </span>
                  )}
                  {job.theater_id !== null && (
                    <span>
                      at{' '}
                      <Link
                        to="/theaters/$theaterId"
                        params={{ theaterId: String(job.theater_id) }}
                        className="text-blue-600 hover:underline"
                      >
                        {job.theater?.name ?? 'Theater'}
                      </Link>
                    </span>
                  )}
                </li>
              ))}
          </ul>
        ) : (
          <div className="text-gray-500">You don't have any jobs listed.</div>
        )}
      </div>

      {auditionerJobs.length > 0 && (
        <div>
          <h4 className="pt-4 text-lg font-medium">Your Auditions</h4>
          <ul className="list-disc list-inside space-y-1">
            {auditionerJobs.map((job) => (
              <li key={job.id}>
                <Link
                  to="/auditions/$jobId"
                  params={{ jobId: String(job.id) }}
                  className="text-blue-600 hover:underline"
                >
                  {job.production?.play?.title ?? 'Audition'}
                </Link>
                {job.theater && (
                  <span className="text-gray-600"> at {job.theater.name}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <hr className="my-4" />

      <div>
        <h4 className="pt-4 text-lg font-medium">Rehearsal schedule</h4>
        {currentProductions.length > 0 &&
          currentProductions.map((production) => (
            <em key={production.id} className="block mb-2">
              <Link
                to="/productions/$productionId/rehearsals"
                params={{ productionId: String(production.id) }}
                className="text-blue-600 hover:underline"
              >
                Full rehearsal schedule for {production.play?.title}
              </Link>
            </em>
          ))}

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-400 text-left">
                <th className="p-[10px] font-medium text-gray-700 border-r border-gray-300">Time</th>
                <th className="p-[10px] font-medium text-gray-700 border-r border-gray-300">Location</th>
                <th className="p-[10px] font-medium text-gray-700 border-r border-gray-300">Title</th>
                <th className="p-[10px] font-medium text-gray-700 border-r border-gray-300">Material</th>
                <th className="p-[10px] font-medium text-gray-700">Notes</th>
              </tr>
            </thead>
            <tbody>{rehearsals}</tbody>
          </table>
        </div>

        <hr className="my-4" />

        <div>
          <h3 className="pt-4 text-xl font-semibold">Conflicts</h3>
          <ConflictsManager userId={user!.id} canEdit={true} />
        </div>
      </div>

      <hr className="my-4" />

      <div>
        <Link
          to="/users/$userId"
          params={{ userId: String(user!.id) }}
          className="text-blue-600 hover:underline"
        >
          Edit your profile/update your account
        </Link>
      </div>
    </div>
  )
}
