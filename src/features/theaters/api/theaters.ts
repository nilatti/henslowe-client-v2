import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../api/client'
import {
  listQueryOptions,
  createMutationFn,
  updateMutationFn,
  deleteMutationFn,
  customQueryOptions,
} from '../../../api/queryFactory'
import type { Theater, TheaterSkeleton } from '../types/theater'

export const theatersQueryOptions = () =>
  listQueryOptions<Theater>('theaters')

export const theaterSkeletonQueryOptions = (id: number) =>
  customQueryOptions<TheaterSkeleton>(
    ['theaters', id, 'skeleton'],
    `/api/v1/theaters/${id}/theater_skeleton`
  )

export function useCreateTheater() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createMutationFn<Theater>('theaters'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['theaters'] }),
  })
}

export function useUpdateTheater() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateMutationFn<Theater>('theaters'),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['theaters'] })
      qc.invalidateQueries({ queryKey: ['theaters', vars.id, 'skeleton'] })
    },
  })
}

export function useCreateSeatSubscriptionCheckout(theaterId: number) {
  return useMutation({
    mutationFn: (price: string): Promise<{ stripeUrl: string }> =>
      api.post(`/api/v1/theaters/${theaterId}/create_seat_subscription_checkout_session`, { price }).then(r => r.data),
  })
}

export function useDeleteTheater() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMutationFn('theaters'),
    onSuccess: (_, id) => {
      // Invalidate (not remove) so the still-mounted TheaterDetail keeps
      // its stale data during navigation instead of immediately refetching
      // a now-404 resource and crashing the render tree.
      qc.invalidateQueries({ queryKey: ['theaters', id, 'skeleton'] })
      qc.invalidateQueries({ queryKey: ['theaters'], exact: true })
    },
  })
}
