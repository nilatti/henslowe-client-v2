import { queryOptions } from '@tanstack/react-query'
import api from '../../../api/client'
import type { DashboardUser } from '../types/dashboard'

export const userDashboardQueryOptions = (userId: number) =>
  queryOptions({
    queryKey: ['users', userId, 'dashboard'],
    queryFn: (): Promise<DashboardUser> =>
      api.get(`/api/v1/users/${userId}`).then((r) => r.data),
  })
