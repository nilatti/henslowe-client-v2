import { queryOptions } from '@tanstack/react-query'
import api from './client'

export function listQueryOptions<T>(resource: string) {
  return queryOptions({
    queryKey: [resource],
    queryFn: (): Promise<T[]> =>
      api.get(`/api/v1/${resource}`).then(r => r.data),
  })
}

export function detailQueryOptions<T>(resource: string, id: number | string) {
  return queryOptions({
    queryKey: [resource, id],
    queryFn: (): Promise<T> =>
      api.get(`/api/v1/${resource}/${id}`).then(r => r.data),
  })
}

export function nestedListQueryOptions<T>(
  parentResource: string,
  parentId: number | string,
  childResource: string
) {
  return queryOptions({
    queryKey: [parentResource, parentId, childResource],
    queryFn: (): Promise<T[]> =>
      api.get(`/api/v1/${parentResource}/${parentId}/${childResource}`)
        .then(r => r.data),
  })
}

export function customQueryOptions<T>(
  queryKey: unknown[],
  url: string,
  params?: Record<string, unknown>
) {
  return queryOptions({
    queryKey,
    queryFn: (): Promise<T> =>
      api.get(url, { params }).then(r => r.data),
  })
}

export function createMutationFn<T>(resource: string, singularOverride?: string) {
  const singular = singularOverride ?? resource.replace(/s$/, '')
  return (data: Partial<T>) =>
    api.post(`/api/v1/${resource}`, { [singular]: data }).then(r => r.data)
}

export function updateMutationFn<T extends { id: number }>(resource: string, singularOverride?: string) {
  const singular = singularOverride ?? resource.replace(/s$/, '')
  return (data: T) =>
    api.put(`/api/v1/${resource}/${data.id}`, { [singular]: data }).then(r => r.data)
}

export function deleteMutationFn(resource: string) {
  return (id: number) =>
    api.delete(`/api/v1/${resource}/${id}`).then(r => r.data)
}
