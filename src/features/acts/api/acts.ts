import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../api/client'
import type { Act, ActWithScenes } from '../types/act'
import type { PlaySkeleton } from '../../plays/types/play'
import { reorderByIds } from '../../../utils/reorder'
import { invalidatePlayOrder } from '../../plays/api/playOrder'

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

// Drag-to-reorder on the play structure tab. ids is every act in its new order.
export function useReorderActs(playId: number) {
  const qc = useQueryClient()
  const key = ['plays', playId, 'skeleton']
  return useMutation({
    mutationFn: (ids: number[]) =>
      api.put(`/api/v1/plays/${playId}/reorder_acts`, { ids }),
    onMutate: async ids => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<PlaySkeleton>(key)
      if (previous) qc.setQueryData<PlaySkeleton>(key, { ...previous, acts: reorderByIds(previous.acts, ids) })
      return { previous }
    },
    onError: (_err, _ids, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous)
    },
    onSettled: () => invalidatePlayOrder(qc, playId),
  })
}
