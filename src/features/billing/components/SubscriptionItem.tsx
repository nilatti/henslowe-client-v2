import { useState } from 'react'
import { format } from 'date-fns'
import { DATE_FORMAT } from '../../../utils/constants'
import type { UserSubscription } from '../types/subscription'
import { useCancelSubscription, useRenewSubscription } from '../api/billing'

interface Props {
  subscription: UserSubscription
  userId: number
}

export default function SubscriptionItem({ subscription, userId }: Props) {
  const [cancellationSuccessful, setCancellationSuccessful] = useState(false)
  const [renewalSuccessful, setRenewalSuccessful] = useState(false)

  const cancelMutation = useCancelSubscription(userId)
  const renewMutation = useRenewSubscription(userId)
  const isPending = cancelMutation.isPending || renewMutation.isPending

  const formatDate = (timestamp: number) =>
    format(new Date(timestamp * 1000), DATE_FORMAT)

  async function handleCancel() {
    await cancelMutation.mutateAsync(subscription.subscription_id)
    setCancellationSuccessful(true)
  }

  async function handleRenew() {
    await renewMutation.mutateAsync(subscription.subscription_id)
    setRenewalSuccessful(true)
  }

  if (cancellationSuccessful) {
    return (
      <li className="py-3">
        <p className="text-green-700">
          Your cancellation was successful. Your subscription will end on:{' '}
          {formatDate(subscription.current_period_end)}
        </p>
        <button
          className="mt-2 text-sm text-blue-600 underline"
          onClick={() => setCancellationSuccessful(false)}
        >
          Back
        </button>
      </li>
    )
  }

  if (renewalSuccessful) {
    return (
      <li className="py-3">
        <p className="text-green-700">Renewal successful!</p>
        <button
          className="mt-2 text-sm text-blue-600 underline"
          onClick={() => setRenewalSuccessful(false)}
        >
          Back
        </button>
      </li>
    )
  }

  return (
    <li className="py-3 border-b border-gray-200">
      <div>
        <strong>{subscription.name}</strong>
      </div>
      <div className="text-sm text-gray-600">Status: {subscription.status}</div>
      <div className="text-sm">
        Started: {formatDate(subscription.current_period_start)}
      </div>
      <div className="text-sm">
        {subscription.cancel_at_period_end ? 'Cancels on:' : 'Renews on:'}{' '}
        {formatDate(subscription.current_period_end)}
      </div>
      <div className="text-sm text-gray-600">
        ${(subscription.amount / 100).toFixed(2)} / {subscription.interval}
      </div>
      <div className="mt-2">
        {!subscription.cancel_at_period_end ? (
          <button
            className="text-sm text-red-600 underline disabled:opacity-50"
            onClick={handleCancel}
            disabled={isPending}
          >
            Cancel subscription at end of current period
          </button>
        ) : (
          <button
            className="text-sm text-blue-600 underline disabled:opacity-50"
            onClick={handleRenew}
            disabled={isPending}
          >
            Renew subscription
          </button>
        )}
      </div>
    </li>
  )
}
