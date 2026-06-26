import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listQueryOptions,
  createMutationFn,
  updateMutationFn,
  deleteMutationFn,
} from '../../../api/queryFactory'
import type { UserDetail, UserSummary, UserEditableFields } from '../types/user'

export const usersQueryOptions = () =>
  listQueryOptions<UserSummary>('users')

export const userQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['users', id],
    queryFn: (): Promise<UserDetail> =>
      import('../../../api/client')
        .then(m => m.default.get(`/api/v1/users/${id}`).then(r => r.data)),
  })

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createMutationFn<UserEditableFields>('users'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateMutationFn<UserEditableFields & { id: number }>('users'),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['users', vars.id] })
      qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUploadHeadshot(userId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) =>
      import('../../../api/client').then(m =>
        m.default.put(`/api/v1/users/${userId}/upload_headshot`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }).then(r => r.data)
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', userId] })
    },
  })
}

export function useUpdatePaidOverride() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, paid_override }: { id: number; paid_override: boolean }) =>
      import('../../../api/client').then(m =>
        m.default.put(`/api/v1/users/${id}`, { user: { paid_override } }).then(r => r.data)
      ),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['users', vars.id] })
      qc.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMutationFn('users'),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: ['users', id] })
      qc.invalidateQueries({ queryKey: ['users'], exact: true })
    },
  })
}
