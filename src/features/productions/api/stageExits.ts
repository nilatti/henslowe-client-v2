import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../api/client'
import type { StageExit } from '../types/stageExit'

export const stageExitsQueryOptions = (productionId: number) =>
  queryOptions({
    queryKey: ['productions', productionId, 'stage_exits'],
    queryFn: (): Promise<StageExit[]> =>
      api.get(`/api/v1/productions/${productionId}/stage_exits`).then(r => r.data),
  })

export function useCreateStageExit(productionId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string }) =>
      api
        .post(`/api/v1/productions/${productionId}/stage_exits`, {
          stage_exit: { ...data, production_id: productionId },
        })
        .then(r => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['productions', productionId, 'stage_exits'] }),
  })
}

export function useUpdateStageExit(productionId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: number; name: string }) =>
      api
        .put(`/api/v1/stage_exits/${data.id}`, {
          stage_exit: { name: data.name, production_id: productionId },
        })
        .then(r => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['productions', productionId, 'stage_exits'] }),
  })
}

export function useDeleteStageExit(productionId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/api/v1/stage_exits/${id}`).then(r => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['productions', productionId, 'stage_exits'] }),
  })
}
