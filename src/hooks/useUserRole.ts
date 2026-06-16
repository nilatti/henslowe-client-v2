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
  theatersWhereUserIsAdmin,
} from '../utils/authorizationUtils'
import { playSkeletonQueryOptions } from '../features/plays/api/plays'
import { productionSkeletonQueryOptions } from '../features/productions/api/productions'

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

export const userProductionJobsQueryOptions = (userId: number, productionId: number) =>
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

export function useUserRoleForProduction(productionId: number, theaterId?: number) {
  const { user } = useAuth()
  const { data: productionJobs = [] } = useQuery(
    userProductionJobsQueryOptions(user!.id, productionId)
  )
  const { data: theaterJobs = [] } = useQuery({
    ...userTheaterJobsQueryOptions(user!.id, theaterId ?? 0),
    enabled: !!theaterId,
  })
  if (!user) return 'visitor'
  if (getSuperAdminRole(user)) return 'admin'
  return getUserRoleForProduction(user, productionJobs, theaterId ? theaterJobs : undefined)
}

export function useIsSuperAdmin() {
  const { user } = useAuth()
  return user ? getSuperAdminRole(user) : false
}

export const userAllJobsQueryOptions = (userId: number) =>
  queryOptions({
    queryKey: ['jobs', { userId }],
    queryFn: () =>
      api.get('/api/v1/jobs', { params: { user_id: userId } }).then(r => r.data),
    staleTime: 1000 * 60 * 10,
  })

export function useIsAnyAdmin() {
  const { user } = useAuth()
  const isSuperAdmin = useIsSuperAdmin()
  const { data: jobs = [] } = useQuery(userAllJobsQueryOptions(user!.id))
  if (!user) return false
  if (isSuperAdmin) return true
  const titles = jobs.map((j: any) => j.specialization?.title ?? '')
  return intersection(titles, THEATER_ADMIN).length > 0
}

// Returns null for superadmins (all theaters allowed), or the set of theater IDs
// where the user holds an admin role.
export function useAdminTheaterIds(): Set<number> | null {
  const { user } = useAuth()
  const isSuperAdmin = useIsSuperAdmin()
  const { data: jobs = [] } = useQuery(userAllJobsQueryOptions(user!.id))
  if (!user || isSuperAdmin) return null
  const allTheaterIds = Array.from(new Set<number>(jobs.map((j: any) => j.theater_id as number)))
  const adminTheaters = theatersWhereUserIsAdmin(
    { id: user.id, jobs },
    allTheaterIds.map(id => ({ id }))
  )
  return new Set(adminTheaters.map(t => t.id))
}

// Returns true if the user can edit/delete this play's structure.
// Canonical plays: superadmin only. Non-canonical (production copies): production or theater admin.
export function useIsPlayAdmin(playId: number): boolean {
  const isSuperAdmin = useIsSuperAdmin()
  const { data: playSkeleton } = useQuery({
    ...playSkeletonQueryOptions(playId),
    enabled: playId > 0,
  })
  const { data: productionSkeleton } = useQuery({
    ...productionSkeletonQueryOptions(playSkeleton?.production_id ?? 0),
    enabled: !playSkeleton?.canonical && (playSkeleton?.production_id ?? 0) > 0,
  })
  const role = useUserRoleForProduction(
    playSkeleton?.production_id ?? 0,
    productionSkeleton?.theater.id
  )
  if (isSuperAdmin) return true
  if (!playSkeleton || playSkeleton.canonical) return false
  return role === 'admin'
}

// TODO: Spaces need their own authorization model (space_id on jobs, SPACE_ADMIN titles).
// Currently approximated as: admin at any associated theater → space admin.
// This is wrong for independent venues that rent to many theaters — those spaces
// should have their own staff, not inherit admin from every tenant's theater admin.
// Fixing this requires a backend migration to add space_id to the jobs table.
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
    return (jobs as any[]).some(
      j => j.production_id == null && THEATER_ADMIN.includes(j.specialization?.title ?? '')
    )
  })

  return isAdmin ? 'theater_admin' : 'visitor'
}
