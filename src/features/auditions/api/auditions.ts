import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../api/client'
import type { OpenAudition } from '../types'
import type { UserEditableFields } from '../../users/types/user'
import { AUDITIONER_SPECIALIZATION_ID } from '../../../utils/constants'

export const openAuditionsQueryOptions = () =>
  queryOptions({
    queryKey: ['open_auditions'],
    queryFn: (): Promise<OpenAudition[]> =>
      api.get('/api/v1/open_auditions').then(r => r.data),
    staleTime: 1000 * 60 * 5,
  })

export function useCreateAuditionerJob(productionId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) =>
      api.post('/api/v1/jobs', {
        job: {
          production_id: productionId,
          user_id: userId,
          specialization_id: AUDITIONER_SPECIALIZATION_ID,
        },
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
