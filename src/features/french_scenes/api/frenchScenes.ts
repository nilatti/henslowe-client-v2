import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../api/client'
import type { FrenchScene, FrenchSceneDetail, OnStage, Song } from '../types/frenchScene'
import type { SceneWithFrenchScenes } from '../../scenes/types/scene'
import type { PlaySkeleton } from '../../plays/types/play'
import { reorderByIds } from '../../../utils/reorder'
import { invalidatePlayOrder } from '../../plays/api/playOrder'

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

export function useCreateOnStage(frenchSceneId: number, playId: number, sceneId: number) {
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
      qc.invalidateQueries({ queryKey: ['plays', playId, 'skeleton'] })
      qc.invalidateQueries({ queryKey: ['scenes', sceneId] })
      qc.invalidateQueries({ queryKey: ['french_scenes', frenchSceneId] })
    },
  })
}

export function useUpdateOnStage(frenchSceneId: number, playId: number, sceneId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<OnStage> & { id: number }) =>
      api.put(`/api/v1/on_stages/${data.id}`, { on_stage: data })
        .then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plays', playId, 'skeleton'] })
      qc.invalidateQueries({ queryKey: ['scenes', sceneId] })
      qc.invalidateQueries({ queryKey: ['french_scenes', frenchSceneId] })
    },
  })
}

export function useDeleteOnStage(frenchSceneId: number, playId: number, sceneId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/api/v1/on_stages/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plays', playId, 'skeleton'] })
      qc.invalidateQueries({ queryKey: ['scenes', sceneId] })
      qc.invalidateQueries({ queryKey: ['french_scenes', frenchSceneId] })
    },
  })
}

export function useCreateSong(frenchSceneId: number, playId: number, sceneId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; character_ids?: number[] }): Promise<Song> =>
      api.post(`/api/v1/french_scenes/${frenchSceneId}/songs`, { song: data }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plays', playId, 'skeleton'] })
      qc.invalidateQueries({ queryKey: ['scenes', sceneId] })
      qc.invalidateQueries({ queryKey: ['french_scenes', frenchSceneId] })
    },
  })
}

export function useUpdateSong(frenchSceneId: number, playId: number, sceneId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: number; title?: string; character_ids?: number[]; character_group_ids?: number[] }): Promise<Song> =>
      api.put(`/api/v1/songs/${data.id}`, { song: data }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plays', playId, 'skeleton'] })
      qc.invalidateQueries({ queryKey: ['scenes', sceneId] })
      qc.invalidateQueries({ queryKey: ['french_scenes', frenchSceneId] })
    },
  })
}

export function useMoveSong(frenchSceneId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: number; direction: 'up' | 'down' }): Promise<Song[]> =>
      api.patch(`/api/v1/songs/${data.id}/move`, { direction: data.direction }).then(r => r.data),
    onSuccess: (songs) => {
      qc.setQueryData(['french_scenes', frenchSceneId], (old: any) =>
        old ? { ...old, songs } : old
      )
    },
  })
}

export function useDeleteSong(frenchSceneId: number, playId: number, sceneId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/api/v1/songs/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plays', playId, 'skeleton'] })
      qc.invalidateQueries({ queryKey: ['scenes', sceneId] })
      qc.invalidateQueries({ queryKey: ['french_scenes', frenchSceneId] })
    },
  })
}

// Drag-to-reorder on the scene page. ids is every French scene in the scene, in its new order.
export function useReorderFrenchScenes(playId: number, sceneId: number) {
  const qc = useQueryClient()
  const sceneKey = ['scenes', sceneId]
  const skeletonKey = ['plays', playId, 'skeleton']
  return useMutation({
    mutationFn: (ids: number[]) =>
      api.put(`/api/v1/scenes/${sceneId}/reorder_french_scenes`, { ids }),
    onMutate: async ids => {
      await Promise.all([qc.cancelQueries({ queryKey: sceneKey }), qc.cancelQueries({ queryKey: skeletonKey })])
      const previousScene = qc.getQueryData<SceneWithFrenchScenes>(sceneKey)
      const previousSkeleton = qc.getQueryData<PlaySkeleton>(skeletonKey)
      if (previousScene) {
        qc.setQueryData<SceneWithFrenchScenes>(sceneKey, {
          ...previousScene,
          french_scenes: reorderByIds(previousScene.french_scenes, ids),
        })
      }
      if (previousSkeleton) {
        qc.setQueryData<PlaySkeleton>(skeletonKey, {
          ...previousSkeleton,
          acts: previousSkeleton.acts.map(a => ({
            ...a,
            scenes: a.scenes.map(s =>
              s.id === sceneId ? { ...s, french_scenes: reorderByIds(s.french_scenes, ids) } : s,
            ),
          })),
        })
      }
      return { previousScene, previousSkeleton }
    },
    onError: (_err, _ids, ctx) => {
      if (ctx?.previousScene) qc.setQueryData(sceneKey, ctx.previousScene)
      if (ctx?.previousSkeleton) qc.setQueryData(skeletonKey, ctx.previousSkeleton)
    },
    onSettled: () => invalidatePlayOrder(qc, playId),
  })
}
