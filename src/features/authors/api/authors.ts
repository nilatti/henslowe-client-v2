import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listQueryOptions,
  detailQueryOptions,
  createMutationFn,
  updateMutationFn,
  deleteMutationFn,
} from '../../../api/queryFactory'
import type { Author, AuthorWithPlays } from '../types/author'

export const authorsQueryOptions = () =>
  listQueryOptions<Author>('authors')

export const authorQueryOptions = (id: number) =>
  detailQueryOptions<AuthorWithPlays>('authors', id)

export function useCreateAuthor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createMutationFn<Author>('authors'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['authors'] }),
  })
}

export function useUpdateAuthor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateMutationFn<Author>('authors'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['authors'] }),
  })
}

export function useDeleteAuthor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMutationFn('authors'),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: ['authors', id] })
      qc.invalidateQueries({ queryKey: ['authors'], exact: true })
    },
  })
}
