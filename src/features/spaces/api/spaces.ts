import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listQueryOptions,
  detailQueryOptions,
  createMutationFn,
  updateMutationFn,
  deleteMutationFn,
  nestedListQueryOptions,
} from '../../../api/queryFactory'
import type { Space, SpaceDetail, SpaceRehearsal } from '../types/space'

export const spacesQueryOptions = () =>
  listQueryOptions<Space>('spaces')

export const spaceQueryOptions = (id: number) =>
  detailQueryOptions<SpaceDetail>('spaces', id)

export const spaceRehearsalsQueryOptions = (id: number) =>
  nestedListQueryOptions<SpaceRehearsal>('spaces', id, 'rehearsals')

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
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: ['spaces', id] })
      qc.invalidateQueries({ queryKey: ['spaces'], exact: true })
    },
  })
}
