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

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMutationFn('users'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}
