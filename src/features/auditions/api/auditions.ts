import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../api/client'
import type { OpenAudition } from '../types'
import type { UserEditableFields } from '../../users/types/user'

export const openAuditionsQueryOptions = () =>
  queryOptions({
    queryKey: ['open_auditions'],
    queryFn: (): Promise<OpenAudition[]> =>
      api.get('/api/v1/open_auditions').then(r => r.data),
    staleTime: 1000 * 60 * 5,
  })

export interface SubmissionData {
  video_url?: string
  notes?: string
}

export function useCreateAuditionerJob(productionId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (submission: SubmissionData = {}) =>
      api.post(`/api/v1/productions/${productionId}/auditions`, {
        audition_submission: submission,
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs', { productionId }] })
    },
  })
}

export function useUpdateAuditionerContact(userId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<UserEditableFields>) =>
      api.put(`/api/v1/users/${userId}`, { user: data }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', userId] })
    },
  })
}
