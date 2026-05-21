import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../api/client'
import type { UserSubscription, StripePrice } from '../types/subscription'

export const stripePricesQueryOptions = queryOptions({
  queryKey: ['stripe-prices'],
  queryFn: (): Promise<StripePrice[]> =>
    api.get('/api/v1/subscriptions').then(r => r.data),
})

export const userSubscriptionsQueryOptions = (userId: number) =>
  queryOptions({
    queryKey: ['subscriptions', { userId }],
    queryFn: (): Promise<UserSubscription[]> =>
      api.get('/api/v1/subscriptions/user_subscriptions', {
        params: { user_id: userId },
      }).then(r => r.data),
  })

export async function redirectToBillingPortal(): Promise<void> {
  const res = await api.post('/api/v1/charges/update_payment_info')
  window.location.href = res.data.stripeUrl
}

export function useCancelSubscription(userId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (subscriptionId: string) =>
      api
        .put('/api/v1/subscriptions/cancel', { subscription_id: subscriptionId })
        .then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', { userId }] })
    },
  })
}

export function useRenewSubscription(userId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (subscriptionId: string) =>
      api
        .put('/api/v1/subscriptions/renew', { subscription_id: subscriptionId })
        .then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', { userId }] })
    },
  })
}
