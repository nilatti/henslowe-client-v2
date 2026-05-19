import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { customQueryOptions } from '../../../api/queryFactory'
import api from '../../../api/client'
import type { ProductionListItem, Production } from '../types/production'

export const productionsQueryOptions = () =>
  queryOptions({
    queryKey: ['productions'],
    queryFn: (): Promise<ProductionListItem[]> =>
      api.get('/api/v1/productions/production_names').then(r => r.data),
  })

export const productionSkeletonQueryOptions = (id: number) =>
  customQueryOptions<Production>(
    ['productions', id, 'skeleton'],
    `/api/v1/productions/${id}/skeleton`
  )

export function useCreateProduction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/api/v1/productions', { production: data }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productions'] }),
  })
}

export function useUpdateProduction(productionId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api
        .patch(`/api/v1/productions/${productionId}`, { production: data })
        .then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productions'] })
      qc.invalidateQueries({ queryKey: ['productions', productionId, 'skeleton'] })
    },
  })
}

export function useDeleteProduction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/api/v1/productions/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['productions'] }),
  })
}
