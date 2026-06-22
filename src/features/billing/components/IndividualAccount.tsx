import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import { useAuth } from '../../../hooks/useAuth'
import { userSubscriptionsQueryOptions, redirectToBillingPortal } from '../api/billing'
import SubscriptionItem from './SubscriptionItem'
import { buildUserName } from '../../../utils/actorUtils'
import { userQueryOptions } from '../../users/api/users'

export default function IndividualAccount() {
  const { user } = useAuth()
  const { data: subscriptions } = useSuspenseQuery(
    userSubscriptionsQueryOptions(user!.id)
  )
  const { data: profile } = useSuspenseQuery(userQueryOptions(user!.id))

  const allJobs = profile.jobs ?? []
  const auditionJobs = allJobs.filter(j => j.specialization?.title === 'Auditioner')
  const productionJobs = allJobs.filter(
    j => j.production_id != null && j.specialization?.title !== 'Auditioner'
  )
  const theaterJobs = allJobs.filter(
    j => j.theater_id != null && j.production_id == null
  )

  const sorted = [...subscriptions].sort(
    (a, b) => a.current_period_start - b.current_period_start
  )

  const activeSubscription =
    sorted.length > 0 && sorted[sorted.length - 1].status === 'active'
      ? sorted[sorted.length - 1]
      : null

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-semibold mb-1">{buildUserName(user!)}</h2>
      <div className="mb-6">
        <div className="text-gray-600">{user!.email}</div>
        <Link
          to={`/users/${user!.id}` as never}
          className="text-blue-600 underline text-sm"
        >
          View and edit your contact info, bio, and other details.
        </Link>
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Subscription info</h3>
        {sorted.length > 0 ? (
          <ul>
            {sorted.map((subscription) => (
              <SubscriptionItem
                key={subscription.subscription_id}
                subscription={subscription}
                userId={user!.id}
              />
            ))}
          </ul>
        ) : (
          <div className="text-gray-600">
            You aren't subscribed for a paid membership.{' '}
            <Link to={"/subscriptions" as never} className="text-blue-600 underline">
              Sign up now!
            </Link>
          </div>
        )}
      </div>
      {activeSubscription && (
        <div className="mb-6">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={redirectToBillingPortal}
          >
            Update payment information
          </button>
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Productions</h3>
        {productionJobs.length > 0 ? (
          <ul className="space-y-2">
            {productionJobs.map(job => {
              const playTitle = job.production?.play?.title
              const theaterName = job.production?.theater?.name ?? job.theater?.name
              const role = job.specialization?.title
              const character = job.character?.name ?? job.character_group?.name
              return (
                <li key={job.id}>
                  <Link
                    to={'/productions/$productionId' as never}
                    params={{ productionId: String(job.production_id) } as never}
                    className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    <span className="text-gray-900 font-medium">
                      {playTitle ?? 'Untitled production'}
                    </span>
                    <span className="text-sm text-gray-500 text-right">
                      <span>
                        {role}{character ? ` — ${character}` : ''}
                      </span>
                      {theaterName && (
                        <span className="block">{theaterName}</span>
                      )}
                      {job.start_date && (
                        <span className="block">
                          {format(parseISO(job.start_date), 'MMM yyyy')}
                          {job.end_date && ` → ${format(parseISO(job.end_date), 'MMM yyyy')}`}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="text-gray-600">No productions yet.</div>
        )}
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Theaters</h3>
        {theaterJobs.length > 0 ? (
          <ul className="space-y-2">
            {theaterJobs.map(job => {
              const theaterName = job.theater?.name
              const role = job.specialization?.title
              return (
                <li key={job.id}>
                  <Link
                    to={'/theaters/$theaterId' as never}
                    params={{ theaterId: String(job.theater_id) } as never}
                    className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    <span className="text-gray-900 font-medium">
                      {theaterName ?? 'Unknown theater'}
                    </span>
                    <span className="text-sm text-gray-500 text-right">
                      {role && <span>{role}</span>}
                      {job.start_date && (
                        <span className="block">
                          {format(parseISO(job.start_date), 'MMM yyyy')}
                          {job.end_date && ` → ${format(parseISO(job.end_date), 'MMM yyyy')}`}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="text-gray-600">No theater affiliations yet.</div>
        )}
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Auditions</h3>
        {auditionJobs.length > 0 ? (
          <ul className="space-y-2">
            {auditionJobs.map(job => {
              const playTitle = job.production?.play?.title
              const theaterName = job.production?.theater?.name ?? job.theater?.name
              return (
                <li key={job.id}>
                  <Link
                    to={`/auditions/${job.id}` as never}
                    className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    <span className="text-gray-900 font-medium">
                      {playTitle ?? 'Untitled production'}
                    </span>
                    {theaterName && (
                      <span className="text-sm text-gray-500">{theaterName}</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="text-gray-600">
            You haven't submitted any auditions yet.{' '}
            <Link to={'/auditions' as never} className="text-blue-600 underline">
              Browse open auditions
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
