import { useMutation, useQueryClient } from '@tanstack/react-query'
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

export function useDeleteTheater() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMutationFn('theaters'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['theaters'] }),
  })
}
