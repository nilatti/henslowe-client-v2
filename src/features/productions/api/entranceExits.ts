import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../api/client'
import type { EntranceExit, EntranceExitUpdatePayload } from '../types/entranceExit'

export const entranceExitsQueryOptions = (frenchSceneId: number) =>
  queryOptions({
    queryKey: ['french_scenes', frenchSceneId, 'entrance_exits'],
    queryFn: (): Promise<EntranceExit[]> =>
      api.get(`/api/v1/french_scenes/${frenchSceneId}/entrance_exits`).then(r => r.data),
  })

export function useCreateEntranceExit(frenchSceneId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      category: 'Enter' | 'Exit'
      line: number | null
      page: number | null
      notes: string | null
      stage_exit_id: number
      character_ids: number[]
    }) =>
      api
        .post(`/api/v1/french_scenes/${frenchSceneId}/entrance_exits`, {
          entrance_exit: { ...data, french_scene_id: frenchSceneId },
        })
        .then(r => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['french_scenes', frenchSceneId, 'entrance_exits'] }),
  })
}

export function useUpdateEntranceExit(frenchSceneId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: EntranceExitUpdatePayload) =>
      api
        .put(`/api/v1/entrance_exits/${id}`, { entrance_exit: data })
        .then(r => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['french_scenes', frenchSceneId, 'entrance_exits'] }),
  })
}

export function useDeleteEntranceExit(frenchSceneId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/api/v1/entrance_exits/${id}`).then(r => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['french_scenes', frenchSceneId, 'entrance_exits'] }),
  })
}
