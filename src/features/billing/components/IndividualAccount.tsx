import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useAuth } from '../../../hooks/useAuth'
import { userSubscriptionsQueryOptions, redirectToBillingPortal } from '../api/billing'
import SubscriptionItem from './SubscriptionItem'
import { buildUserName } from '../../../utils/actorUtils'

export default function IndividualAccount() {
  const { user } = useAuth()
  const { data: subscriptions } = useSuspenseQuery(
    userSubscriptionsQueryOptions(user!.id)
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
        <div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={redirectToBillingPortal}
          >
            Update payment information
          </button>
        </div>
      )}
    </div>
  )
}
