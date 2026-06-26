import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Link } from '@tanstack/react-router'
import { useCreateJob } from '../../jobs/api/jobs'
import { specializationsQueryOptions } from '../../specializations/queries'
import { theatersQueryOptions } from '../../theaters/api/theaters'
import { productionsQueryOptions } from '../../productions/api/productions'
import { userAllJobsQueryOptions } from '../../../hooks/useUserRole'
import { theatersWhereUserIsAdmin, productionsWhereUserIsAdmin } from '../../../utils/authorizationUtils'
import { useAuth } from '../../../hooks/useAuth'
import { useUpdatePaidOverride } from '../api/users'
import { Button, FormField, inputClass } from '../../../components/ui'

interface Props {
  userId: number
  invalidateKey: unknown[]
  onSuccess: () => void
  onCancel: () => void
  targetUserSubscriptionStatus?: string
  targetUserPaidOverride?: boolean
  // When provided, restricts available theaters/productions to the overlap context.
  // Admins may only assign jobs within theaters/productions the target user is already part of.
  targetUserJobs?: { theater_id: number; production_id?: number | null }[]
}

export function AddJobToUserForm({ userId, invalidateKey, onSuccess, onCancel, targetUserJobs, targetUserSubscriptionStatus, targetUserPaidOverride }: Props) {
  const { user: currentUser } = useAuth()
  const create = useCreateJob(invalidateKey)
  const updatePaidOverride = useUpdatePaidOverride()

  const { data: allJobs = [] } = useQuery(userAllJobsQueryOptions(currentUser!.id))
  const { data: theaters = [] } = useQuery(theatersQueryOptions())
  const { data: productions = [] } = useQuery(productionsQueryOptions())
  const { data: specializations = [] } = useQuery(specializationsQueryOptions())

  const today = format(new Date(), 'yyyy-MM-dd')
  const [context, setContext] = useState('')
  const [specializationId, setSpecializationId] = useState(0)
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isSuperAdmin = currentUser?.is_superadmin === true
  const userWithJobs = { id: currentUser!.id, is_superadmin: isSuperAdmin, jobs: allJobs as any[] }

  const adminTheaters = isSuperAdmin
    ? theaters
    : theatersWhereUserIsAdmin(userWithJobs, theaters) as typeof theaters

  const productionsWithTheaterId = productions.map(p => ({
    id: p.id,
    theater_id: p.theater?.id,
    play: p.play,
  }))
  const adminProductionIds = new Set(
    productionsWhereUserIsAdmin(userWithJobs, productionsWithTheaterId).map(p => p.id)
  )
  const adminProductions = isSuperAdmin
    ? productions
    : productions.filter(p => adminProductionIds.has(p.id))

  // Non-superadmins are restricted to the overlap context: theaters where the target
  // already has a job, and productions at those theaters or where the target has a
  // direct production job. Superadmins may assign to any theater or production.
  const applyOverlapFilter = !!targetUserJobs && !isSuperAdmin
  const theaterIds = new Set(targetUserJobs?.map(j => j.theater_id) ?? [])
  const productionIds = new Set(
    targetUserJobs?.map(j => j.production_id).filter((id): id is number => id != null) ?? []
  )
  const overlapTheaters = applyOverlapFilter
    ? adminTheaters.filter(t => theaterIds.has(t.id))
    : adminTheaters
  const overlapTheaterIds = new Set(overlapTheaters.map(t => t.id))
  const overlapProductions = applyOverlapFilter
    ? adminProductions.filter(p => {
        const theaterIdForProd = productionsWithTheaterId.find(pt => pt.id === p.id)?.theater_id
        return (theaterIdForProd != null && overlapTheaterIds.has(theaterIdForProd)) ||
          productionIds.has(p.id)
      })
    : adminProductions

  const selectedSpec = specializations.find(s => s.id === specializationId)
  const isAdminRole = selectedSpec ? (selectedSpec.production_admin || selectedSpec.theater_admin) : false
  const targetUserPaid = targetUserPaidOverride || targetUserSubscriptionStatus === 'active'

  const [type, idStr] = context.split(':')
  const contextTheater = type === 'theater' ? overlapTheaters.find(t => t.id === Number(idStr)) : null
  const contextProduction = type === 'production' ? overlapProductions.find(p => p.id === Number(idStr)) : null
  const contextTheaterFake = contextTheater?.fake === true ||
    (contextProduction ? (contextProduction as any).theater?.fake === true : false)

  const showPaymentWarning = isAdminRole && !contextTheaterFake && !targetUserPaid && !!context && !!specializationId

  async function doCreate() {
    await create.mutateAsync({
      user_id: userId,
      specialization_id: specializationId,
      theater_id: type === 'theater' ? Number(idStr) : null,
      production_id: type === 'production' ? Number(idStr) : null,
      start_date: startDate || null,
      end_date: endDate || null,
    })
    onSuccess()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!context || !specializationId || (showPaymentWarning && !isSuperAdmin)) return
    setSubmitting(true)
    try {
      await doCreate()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGrantAndAdd() {
    setSubmitting(true)
    try {
      await updatePaidOverride.mutateAsync({ id: userId, paid_override: true })
      await doCreate()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-gray-200 rounded-md bg-gray-50 mt-3">
      <h4 className="text-sm font-semibold text-gray-800">Add job</h4>

      <FormField label="Theater or production" required>
        <select
          value={context}
          onChange={e => setContext(e.target.value)}
          required
          className={inputClass}
        >
          <option value="">Select...</option>
          {overlapTheaters.length > 0 && (
            <optgroup label="Theaters">
              {overlapTheaters.map(t => (
                <option key={t.id} value={`theater:${t.id}`}>{t.name}</option>
              ))}
            </optgroup>
          )}
          {overlapProductions.length > 0 && (
            <optgroup label="Productions">
              {overlapProductions.map(p => (
                <option key={p.id} value={`production:${p.id}`}>
                  {p.play?.title ?? `Production ${p.id}`}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </FormField>

      <FormField label="Role" required>
        <select
          value={specializationId}
          onChange={e => setSpecializationId(Number(e.target.value))}
          required
          className={inputClass}
        >
          <option value={0}>Select role</option>
          {[...specializations].sort((a, b) => a.title.localeCompare(b.title)).map(s => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Start date">
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className={inputClass}
          />
        </FormField>
        <FormField label="End date">
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </div>

      {showPaymentWarning && (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <p className="font-medium mb-1">Subscription required for admin roles</p>
          <p>
            This user doesn't have an active subscription. Admin roles require a paid membership.{' '}
            {!isSuperAdmin && (
              <Link to={'/subscriptions' as never} className="underline font-medium">
                Subscribe here
              </Link>
            )}
          </p>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        {showPaymentWarning && isSuperAdmin ? (
          <Button
            type="button"
            disabled={submitting}
            onClick={handleGrantAndAdd}
          >
            {submitting ? 'Saving...' : 'Add anyway (grant paid access)'}
          </Button>
        ) : (
          <Button type="submit" disabled={submitting || !context || !specializationId || (showPaymentWarning && !isSuperAdmin)}>
            {submitting ? 'Saving...' : 'Add job'}
          </Button>
        )}
      </div>
    </form>
  )
}
