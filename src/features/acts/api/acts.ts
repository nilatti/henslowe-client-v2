import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../api/client'
import type { Act, ActWithScenes } from '../types/act'

export const actQueryOptions = (actId: number) =>
  queryOptions({
    queryKey: ['acts', actId],
    queryFn: (): Promise<ActWithScenes> =>
      api.get(`/api/v1/acts/${actId}`).then(r => r.data),
  })

export function useCreateAct(playId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Act>) =>
      api.post(`/api/v1/plays/${playId}/acts`, { act: data }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plays', playId, 'skeleton'] })
    },
  })
}

export function useUpdateAct(playId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Act) =>
      api.put(`/api/v1/acts/${data.id}`, { act: data }).then(r => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['plays', playId, 'skeleton'] })
      qc.invalidateQueries({ queryKey: ['acts', vars.id] })
    },
  })
}

export function useDeleteAct(playId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/api/v1/acts/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plays', playId, 'skeleton'] })
    },
  })
}
