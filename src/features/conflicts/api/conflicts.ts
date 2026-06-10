import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../api/client'
import type { Conflict, ConflictPattern } from '../types/conflict'

export const userConflictsQueryOptions = (userId: number) =>
  queryOptions({
    queryKey: ['conflicts', { userId }],
    queryFn: (): Promise<Conflict[]> =>
      api.get(`/api/v1/users/${userId}/conflicts`).then(r => r.data),
  })

export const userConflictPatternsQueryOptions = (userId: number) =>
  queryOptions({
    queryKey: ['conflict_patterns', { userId }],
    queryFn: (): Promise<ConflictPattern[]> =>
      api.get(`/api/v1/users/${userId}/conflict_patterns`).then(r => r.data),
  })

export const spaceConflictsQueryOptions = (spaceId: number) =>
  queryOptions({
    queryKey: ['conflicts', { spaceId }],
    queryFn: (): Promise<Conflict[]> =>
      api.get(`/api/v1/spaces/${spaceId}/conflicts`).then(r => r.data),
  })

export const spaceConflictPatternsQueryOptions = (spaceId: number) =>
  queryOptions({
    queryKey: ['conflict_patterns', { spaceId }],
    queryFn: (): Promise<ConflictPattern[]> =>
      api.get(`/api/v1/spaces/${spaceId}/conflict_patterns`).then(r => r.data),
  })

const invalidateUserConflicts = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({
    predicate: (query) =>
      Array.isArray(query.queryKey) && query.queryKey.includes('user_conflicts'),
  })

export function useCreateConflict(
  invalidateKey: unknown[],
  userId?: number,
  spaceId?: number
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Conflict>) => {
      const url = userId
        ? `/api/v1/users/${userId}/conflicts`
        : `/api/v1/spaces/${spaceId}/conflicts`
      return api.post(url, { conflict: data }).then(r => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invalidateKey })
      invalidateUserConflicts(qc)
    },
  })
}

export function useUpdateConflict(invalidateKey: unknown[]) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Conflict) =>
      api.put(`/api/v1/conflicts/${data.id}`, { conflict: data }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invalidateKey })
      invalidateUserConflicts(qc)
    },
  })
}

export function useDeleteConflict(invalidateKey: unknown[]) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/api/v1/conflicts/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invalidateKey })
      invalidateUserConflicts(qc)
    },
  })
}

export function useDeleteConflictPattern(invalidateKey: unknown[]) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/api/v1/conflict_patterns/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invalidateKey })
      qc.invalidateQueries({ queryKey: ['conflicts'] })
      invalidateUserConflicts(qc)
    },
  })
}

// build_conflict_schedule creates the pattern AND kicks off the Sidekiq worker
export function useBuildConflictSchedule(
  parentId: number,
  parentType: 'user' | 'space',
  invalidateKey: unknown[]
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (pattern: object) =>
      api.put(
        `/api/v1/${parentType}s/${parentId}/build_conflict_schedule`,
        { conflict_schedule_pattern: pattern }
      ).then(r => r.data),
    onSuccess: () => {
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: invalidateKey })
        qc.invalidateQueries({ queryKey: ['conflicts'] })
        invalidateUserConflicts(qc)
      }, 3000)
    },
  })
}
