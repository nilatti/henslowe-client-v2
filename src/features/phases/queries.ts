import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listQueryOptions,
  detailQueryOptions,
  createMutationFn,
  deleteMutationFn,
} from '../../api/queryFactory'
import api from '../../api/client'
import type { Phase } from './types'

export const phasesQueryOptions = () => listQueryOptions<Phase>('phases')
export const phaseQueryOptions = (id: number) => detailQueryOptions<Phase>('phases', id)

export const createPhaseFn = createMutationFn<Phase>('phases')
export const deletePhaseFn = deleteMutationFn('phases')
export function updatePhaseFn(data: { id: number; name: string; position: number | null }) {
  return api.put(`/api/v1/phases/${data.id}`, { phase: data }).then(r => r.data)
}

export function useUpsertProductionPhases(productionId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (phases: { phase_id: number; start_date: string | null; end_date: string | null }[]) =>
      api.put(`/api/v1/productions/${productionId}/production_phases/upsert`, {
        production_phases: phases,
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productions', productionId, 'skeleton'] })
    },
  })
}
