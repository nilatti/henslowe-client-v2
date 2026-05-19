import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listQueryOptions,
  detailQueryOptions,
  createMutationFn,
  updateMutationFn,
  deleteMutationFn,
} from '../../../api/queryFactory'
import type { Space, SpaceDetail } from '../types/space'

export const spacesQueryOptions = () =>
  listQueryOptions<Space>('spaces')

export const spaceQueryOptions = (id: number) =>
  detailQueryOptions<SpaceDetail>('spaces', id)

export function useCreateSpace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createMutationFn<Space & { theater_ids?: number[] }>('spaces'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spaces'] }),
  })
}

export function useUpdateSpace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateMutationFn<Space & { theater_ids?: number[] }>('spaces'),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['spaces'] })
      qc.invalidateQueries({ queryKey: ['spaces', vars.id] })
    },
  })
}

export function useDeleteSpace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMutationFn('spaces'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spaces'] }),
  })
}
