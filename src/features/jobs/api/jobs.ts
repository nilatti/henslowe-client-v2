import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../api/client'
import type { Job, JobWithDetails } from '../types/job'

export const productionJobsQueryOptions = (productionId: number) =>
  queryOptions({
    queryKey: ['jobs', { productionId }],
    queryFn: (): Promise<JobWithDetails[]> =>
      api.get('/api/v1/jobs', {
        params: { production_id: productionId },
      }).then(r => r.data),
  })

export const theaterJobsQueryOptions = (theaterId: number) =>
  queryOptions({
    queryKey: ['jobs', { theaterId }],
    queryFn: (): Promise<JobWithDetails[]> =>
      api.get('/api/v1/jobs', {
        params: { theater_id: theaterId },
      }).then(r => r.data),
  })

export const userJobsQueryOptions = (userId: number) =>
  queryOptions({
    queryKey: ['jobs', { userId }],
    queryFn: (): Promise<JobWithDetails[]> =>
      api.get('/api/v1/jobs', {
        params: { user_id: userId },
      }).then(r => r.data),
    staleTime: 1000 * 60 * 5,
  })

export function useCreateJob(invalidateKey: unknown[]) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Job>) =>
      api.post('/api/v1/jobs', { job: data }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invalidateKey })
    },
  })
}

export function useUpdateJob(invalidateKey: unknown[]) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Job> & { id: number }) =>
      api.put(`/api/v1/jobs/${data.id}`, { job: data }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invalidateKey })
    },
  })
}

export function useDeleteJob(invalidateKey: unknown[]) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/api/v1/jobs/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invalidateKey })
    },
  })
}

// Fake actors endpoint — hits the dedicated /users/fake route
export const fakeUsersQueryOptions = () =>
  queryOptions({
    queryKey: ['users', { fake: true }],
    queryFn: (): Promise<any[]> =>
      api.get('/api/v1/users/fake').then(r => r.data),
    staleTime: 1000 * 60 * 10,
  })
