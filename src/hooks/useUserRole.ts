import { useQuery, useQueries } from '@tanstack/react-query'
import { queryOptions } from '@tanstack/react-query'
import { intersection } from '../utils/arrayUtils'
import { THEATER_ADMIN } from '../utils/constants'
import { useAuth } from './useAuth'
import api from '../api/client'
import {
  getUserRoleForTheater,
  getUserRoleForProduction,
  getSuperAdminRole,
} from '../utils/authorizationUtils'

// Query options — cached for 10 minutes so role checks don't fire on every render
const userTheaterJobsQueryOptions = (userId: number, theaterId: number) =>
  queryOptions({
    queryKey: ['jobs', { userId, theaterId }],
    queryFn: () =>
      api.get('/api/v1/jobs', {
        params: { user_id: userId, theater_id: theaterId },
      }).then(r => r.data),
    staleTime: 1000 * 60 * 10,
  })

const userProductionJobsQueryOptions = (userId: number, productionId: number) =>
  queryOptions({
    queryKey: ['jobs', { userId, productionId }],
    queryFn: () =>
      api.get('/api/v1/jobs', {
        params: { user_id: userId, production_id: productionId },
      }).then(r => r.data),
    staleTime: 1000 * 60 * 10,
  })

export function useUserRoleForTheater(theaterId: number) {
  const { user } = useAuth()
  const { data: jobs = [] } = useQuery(
    userTheaterJobsQueryOptions(user!.id, theaterId)
  )
  if (!user) return 'visitor'
  if (getSuperAdminRole(user)) return 'admin'
  return getUserRoleForTheater(user, jobs)
}

export function useUserRoleForProduction(productionId: number) {
  const { user } = useAuth()
  const { data: jobs = [] } = useQuery(
    userProductionJobsQueryOptions(user!.id, productionId)
  )
  if (!user) return 'visitor'
  if (getSuperAdminRole(user)) return 'admin'
  return getUserRoleForProduction(user, jobs)
}

export function useIsSuperAdmin() {
  const { user } = useAuth()
  return user ? getSuperAdminRole(user) : false
}

export function useUserRoleForSpace(spaceTheaterIds: number[]) {
  const { user } = useAuth()
  const isSuperAdmin = useIsSuperAdmin()

  const results = useQueries({
    queries: spaceTheaterIds.map(theaterId =>
      userTheaterJobsQueryOptions(user!.id, theaterId)
    ),
  })

  if (!user) return 'visitor'
  if (isSuperAdmin) return 'theater_admin'

  const isAdmin = results.some(({ data }) => {
    const jobs = data ?? []
    const titles = jobs.map((j: any) => j.specialization?.title ?? '')
    return intersection(titles, THEATER_ADMIN).length > 0
  })

  return isAdmin ? 'theater_admin' : 'visitor'
}
