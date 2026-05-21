import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  customQueryOptions,
  createMutationFn,
  updateMutationFn,
  deleteMutationFn,
} from '../../../api/queryFactory'
import api from '../../../api/client'
import { type PlayListItem, type PlaySkeleton, type PlayWithCharacters } from '../types/play'

// List — uses play_titles endpoint for minimal payload
export const playsQueryOptions = () =>
  queryOptions({
    queryKey: ['plays'],
    queryFn: (): Promise<PlayListItem[]> =>
      api.get('/api/v1/plays/play_titles').then(r => r.data),
  })

// Full show — characters with aggregated lines, used for character breakdown
export const playQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['plays', id],
    queryFn: (): Promise<PlayWithCharacters> =>
      api.get(`/api/v1/plays/${id}`).then(r => r.data),
  })

// Skeleton — full hierarchy for detail page
export const playSkeletonQueryOptions = (id: number) =>
  customQueryOptions<PlaySkeleton>(
    ['plays', id, 'skeleton'],
    `/api/v1/plays/${id}/play_skeleton`
  )

export function useCreatePlay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createMutationFn<PlayListItem>('plays'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plays'] }),
  })
}

export function useUpdatePlay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateMutationFn<PlaySkeleton>('plays'),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['plays'] })
      qc.invalidateQueries({ queryKey: ['plays', vars.id, 'skeleton'] })
    },
  })
}

export function useDeletePlay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMutationFn('plays'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plays'] }),
  })
}
