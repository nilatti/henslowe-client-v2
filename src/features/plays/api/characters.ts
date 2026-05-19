import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  updateMutationFn,
  deleteMutationFn,
} from '../../../api/queryFactory'
import api from '../../../api/client'
import { type Character, type PlayCharacterGroup } from '../types/play'

export const characterQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['characters', id],
    queryFn: (): Promise<Character> =>
      api.get(`/api/v1/characters/${id}`).then(r => r.data),
  })

export function useCreateCharacter(playId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Character, 'id'>) =>
      api.post(`/api/v1/plays/${playId}/characters`, { character: data }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plays', playId, 'skeleton'] }),
  })
}

export function useUpdateCharacter(playId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateMutationFn<Character>('characters'),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['plays', playId, 'skeleton'] })
      qc.invalidateQueries({ queryKey: ['characters', vars.id] })
    },
  })
}

export function useDeleteCharacter(playId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMutationFn('characters'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plays', playId, 'skeleton'] }),
  })
}

export function useCreateCharacterGroup(playId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Pick<PlayCharacterGroup, 'name'>) =>
      api
        .post(`/api/v1/plays/${playId}/character_groups`, { character_group: { ...data, play_id: playId } })
        .then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plays', playId, 'skeleton'] }),
  })
}

export function useUpdateCharacterGroup(playId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateMutationFn<PlayCharacterGroup>('character_groups'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plays', playId, 'skeleton'] }),
  })
}

export function useDeleteCharacterGroup(playId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMutationFn('character_groups'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plays', playId, 'skeleton'] }),
  })
}
