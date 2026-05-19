import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../api/client'
import { customQueryOptions } from '../../../api/queryFactory'
import type { Rehearsal, RehearsalWithDetails } from '../types/rehearsal'

export interface TextUnitWithOnStages {
  id: number
  number: number | string
  pretty_name?: string
  heading?: string
  find_on_stages: { user_id: number | null; character_id: number | null }[]
  rehearsals?: { id: number; start_time: string; end_time: string }[]
  isScheduled?: boolean
  isRecommended?: boolean
  reasonsForRecommendation?: { unavailableUsers: { id: number; first_name: string; last_name: string }[] }
  furtherInfo?: string
}

export const playActOnStagesQueryOptions = (playId: number) =>
  customQueryOptions<TextUnitWithOnStages[]>(
    ['plays', playId, 'act_on_stages'],
    `/api/v1/plays/${playId}/play_act_on_stages`
  )

export const playSceneOnStagesQueryOptions = (playId: number) =>
  customQueryOptions<TextUnitWithOnStages[]>(
    ['plays', playId, 'scene_on_stages'],
    `/api/v1/plays/${playId}/play_scene_on_stages`
  )

export const playFrenchSceneOnStagesQueryOptions = (playId: number) =>
  customQueryOptions<TextUnitWithOnStages[]>(
    ['plays', playId, 'french_scene_on_stages'],
    `/api/v1/plays/${playId}/play_french_scene_on_stages`
  )

export const productionRehearsalsQueryOptions = (productionId: number) =>
  queryOptions({
    queryKey: ['rehearsals', { productionId }],
    queryFn: (): Promise<RehearsalWithDetails[]> =>
      api.get(`/api/v1/productions/${productionId}/rehearsals`)
        .then(r => r.data),
  })

export function useCreateRehearsal(productionId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Rehearsal>) =>
      api.post(`/api/v1/productions/${productionId}/rehearsals`, {
        rehearsal: data,
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rehearsals', { productionId }] })
    },
  })
}

export function useUpdateRehearsal(productionId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Rehearsal> & { id: number }) =>
      api.put(`/api/v1/rehearsals/${data.id}`, { rehearsal: data })
        .then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rehearsals', { productionId }] })
    },
  })
}

export function useDeleteRehearsal(productionId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/api/v1/rehearsals/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rehearsals', { productionId }] })
    },
  })
}

export function useBuildRehearsalSchedule(productionId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (pattern: object) =>
      api.put(`/api/v1/productions/${productionId}/build_rehearsal_schedule`, {
        production: { rehearsal_schedule_pattern: pattern },
      }).then(r => r.data),
    onSuccess: () => {
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['rehearsals', { productionId }] })
      }, 5000)
    },
  })
}
