import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../api/client'
import type { Scene, SceneWithFrenchScenes } from '../types/scene'
import type { ActWithScenes } from '../../acts/types/act'
import type { PlaySkeleton } from '../../plays/types/play'
import { reorderByIds } from '../../../utils/reorder'
import { invalidatePlayOrder } from '../../plays/api/playOrder'

export const sceneQueryOptions = (sceneId: number) =>
  queryOptions({
    queryKey: ['scenes', sceneId],
    queryFn: (): Promise<SceneWithFrenchScenes> =>
      api.get(`/api/v1/scenes/${sceneId}`).then(r => r.data),
  })

export function useCreateScene(playId: number, actId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Scene>) =>
      api.post(`/api/v1/acts/${actId}/scenes`, { scene: data })
        .then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plays', playId, 'skeleton'] })
      qc.invalidateQueries({ queryKey: ['acts', actId] })
    },
  })
}

export function useUpdateScene(playId: number, actId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Scene) =>
      api.put(`/api/v1/scenes/${data.id}`, { scene: data })
        .then(r => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['plays', playId, 'skeleton'] })
      qc.invalidateQueries({ queryKey: ['acts', actId] })
      qc.invalidateQueries({ queryKey: ['scenes', vars.id] })
    },
  })
}

export function useDeleteScene(playId: number, actId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/api/v1/scenes/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plays', playId, 'skeleton'] })
      qc.invalidateQueries({ queryKey: ['acts', actId] })
    },
  })
}

// Drag-to-reorder on the act page. ids is every scene in the act, in its new order.
export function useReorderScenes(playId: number, actId: number) {
  const qc = useQueryClient()
  const actKey = ['acts', actId]
  const skeletonKey = ['plays', playId, 'skeleton']
  return useMutation({
    mutationFn: (ids: number[]) =>
      api.put(`/api/v1/acts/${actId}/reorder_scenes`, { ids }),
    onMutate: async ids => {
      await Promise.all([qc.cancelQueries({ queryKey: actKey }), qc.cancelQueries({ queryKey: skeletonKey })])
      const previousAct = qc.getQueryData<ActWithScenes>(actKey)
      const previousSkeleton = qc.getQueryData<PlaySkeleton>(skeletonKey)
      if (previousAct) qc.setQueryData<ActWithScenes>(actKey, { ...previousAct, scenes: reorderByIds(previousAct.scenes, ids) })
      if (previousSkeleton) {
        qc.setQueryData<PlaySkeleton>(skeletonKey, {
          ...previousSkeleton,
          acts: previousSkeleton.acts.map(a => (a.id === actId ? { ...a, scenes: reorderByIds(a.scenes, ids) } : a)),
        })
      }
      return { previousAct, previousSkeleton }
    },
    onError: (_err, _ids, ctx) => {
      if (ctx?.previousAct) qc.setQueryData(actKey, ctx.previousAct)
      if (ctx?.previousSkeleton) qc.setQueryData(skeletonKey, ctx.previousSkeleton)
    },
    onSettled: () => invalidatePlayOrder(qc, playId),
  })
}
