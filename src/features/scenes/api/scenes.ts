import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../api/client'
import type { Scene, SceneWithFrenchScenes } from '../types/scene'

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
