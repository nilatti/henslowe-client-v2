import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../api/client'
import type { FrenchScene, FrenchSceneDetail, OnStage } from '../types/frenchScene'

export const frenchSceneQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['french_scenes', id],
    queryFn: (): Promise<FrenchSceneDetail> =>
      api.get(`/api/v1/french_scenes/${id}`).then(r => r.data),
  })

export function useCreateFrenchScene(playId: number, sceneId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<FrenchScene>) =>
      api.post(`/api/v1/scenes/${sceneId}/french_scenes`, {
        french_scene: data,
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plays', playId, 'skeleton'] })
      qc.invalidateQueries({ queryKey: ['scenes', sceneId] })
    },
  })
}

export function useUpdateFrenchScene(playId: number, sceneId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: FrenchScene) =>
      api.put(`/api/v1/french_scenes/${data.id}`, {
        french_scene: data,
      }).then(r => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['plays', playId, 'skeleton'] })
      qc.invalidateQueries({ queryKey: ['scenes', sceneId] })
      qc.invalidateQueries({ queryKey: ['french_scenes', vars.id] })
    },
  })
}

export function useDeleteFrenchScene(playId: number, sceneId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/api/v1/french_scenes/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plays', playId, 'skeleton'] })
      qc.invalidateQueries({ queryKey: ['scenes', sceneId] })
    },
  })
}

export function useCreateOnStage(frenchSceneId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      character_id?: number | null
      character_group_id?: number | null
      french_scene_id: number
      nonspeaking: boolean
      offstage: boolean
      description?: string | null
    }) =>
      api.post(`/api/v1/french_scenes/${frenchSceneId}/on_stages`, { on_stage: data }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['french_scenes', frenchSceneId] })
    },
  })
}

export function useUpdateOnStage(frenchSceneId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<OnStage> & { id: number }) =>
      api.put(`/api/v1/on_stages/${data.id}`, { on_stage: data })
        .then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['french_scenes', frenchSceneId] })
    },
  })
}

export function useDeleteOnStage(frenchSceneId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/api/v1/on_stages/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['french_scenes', frenchSceneId] })
    },
  })
}
