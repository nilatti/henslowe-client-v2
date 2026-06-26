import { useForm } from '@tanstack/react-form'
import { useStore } from '@tanstack/react-store'
import { useSuspenseQuery, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useCreateJob, useUpdateJob, productionJobsQueryOptions } from '../api/jobs'
import { specializationsQueryOptions } from '../../specializations/queries'
import { usersQueryOptions, useUpdatePaidOverride } from '../../users/api/users'
import { productionSkeletonQueryOptions } from '../../productions/api/productions'
import { AUDITIONER_SPECIALIZATION_ID } from '../../../utils/constants'
import type { Job, JobWithDetails } from '../types/job'
import { FormField, FormActions, inputClass } from '../../../components/ui'
import { useAuth } from '../../../hooks/useAuth'
import { UserCombobox } from './UserCombobox'
import { format } from 'date-fns'

interface JobFormProps {
  job?: JobWithDetails
  productionId?: number
  theaterId?: number
  specializationId?: number
  isDreamTheater?: boolean
  invalidateKey: unknown[]
  onSuccess: () => void
  onCancel: () => void
}

export function JobForm({
  job,
  productionId,
  theaterId,
  specializationId,
  isDreamTheater = false,
  invalidateKey,
  onSuccess,
  onCancel,
}: JobFormProps) {
  const create = useCreateJob(invalidateKey)
  const update = useUpdateJob(invalidateKey)
  const updatePaidOverride = useUpdatePaidOverride()
  const { data: specializations } = useSuspenseQuery(specializationsQueryOptions())
  const { data: users } = useSuspenseQuery(usersQueryOptions())
  const { data: productionJobs } = useQuery({
    ...productionJobsQueryOptions(productionId ?? 0),
    enabled: !!productionId,
  })
  const { user: currentUser } = useAuth()
  const isSuperAdmin = currentUser?.is_superadmin === true
  const isEditing = !!job
  const { data: productionSkeleton } = useQuery({
    ...productionSkeletonQueryOptions(productionId ?? 0),
    enabled: !!productionId && !isEditing,
  })

  const isSubscribed = currentUser?.subscription_status === 'active'

  const today = format(new Date(), 'yyyy-MM-dd')

  function getPhaseDate(phaseId: number | null | undefined, field: 'start_date' | 'end_date'): string {
    if (!phaseId || !productionSkeleton) return ''
    const pp = productionSkeleton.production_phases?.find(p => p.phase_id === phaseId)
    return pp?.[field] ?? ''
  }

  const resolvedSpecId = specializationId ?? 0
  const resolvedSpec = specializations?.find(s => s.id === resolvedSpecId)
  const defaultStart = isEditing ? (job?.start_date ?? today) : (getPhaseDate(resolvedSpec?.default_start_phase_id, 'start_date') || today)
  const defaultEnd = isEditing ? (job?.end_date ?? '') : getPhaseDate(resolvedSpec?.default_end_phase_id, 'end_date')

  const form = useForm({
    defaultValues: {
      user_id: job?.user_id ?? 0,
      specialization_id: resolvedSpecId,
      start_date: defaultStart,
      end_date: defaultEnd,
    },
    onSubmit: async ({ value }) => {
      const payload: Partial<Job> = {
        ...value,
        production_id: productionId ?? job?.production_id ?? null,
        theater_id: theaterId ?? job?.theater_id ?? null,
        user_id: value.user_id || null,
        specialization_id: value.specialization_id || null,
        end_date: value.end_date || null,
      }
      if (isEditing) {
        await update.mutateAsync({ ...payload, id: job.id })
      } else {
        await create.mutateAsync(payload)
      }
      onSuccess()
    },
  })

  const selectedSpecializationId = useStore(form.store, state => state.values.specialization_id)
  const selectedUserId = useStore(form.store, state => state.values.user_id)

  function applyPhaseDefaults(specId: number) {
    if (isEditing || !productionSkeleton) return
    const spec = specializations.find(s => s.id === specId)
    if (!spec) return
    const start = getPhaseDate(spec.default_start_phase_id, 'start_date')
    const end = getPhaseDate(spec.default_end_phase_id, 'end_date')
    if (start) form.setFieldValue('start_date', start)
    if (end) form.setFieldValue('end_date', end)
  }

  const isAuditionerJob = selectedSpecializationId === AUDITIONER_SPECIALIZATION_ID ||
    specializationId === AUDITIONER_SPECIALIZATION_ID

  const effectiveSpecId = specializationId ?? selectedSpecializationId
  const effectiveSpec = specializations?.find(s => s.id === effectiveSpecId)
  const isAdminRole = effectiveSpec
    ? (effectiveSpec.production_admin || effectiveSpec.theater_admin)
    : false

  const usersTyped = users as (typeof users[number] & { fake?: boolean; subscription_status?: string; paid_override?: boolean })[]

  const availableUsers = isDreamTheater
    ? usersTyped.filter(u => u.fake)
    : (isAuditionerJob && !isSubscribed && !isSuperAdmin)
      ? usersTyped.filter(u => u.fake)
      : usersTyped.filter(u => !u.fake)

  const takenUserIds = new Set(
    (productionJobs ?? [])
      .filter(j =>
        j.specialization_id === selectedSpecializationId &&
        j.user_id != null &&
        j.user_id !== job?.user_id
      )
      .map(j => j.user_id!)
  )

  const filteredUsers = availableUsers.filter(u => !takenUserIds.has(u.id))

  const selectedUser = usersTyped.find(u => u.id === selectedUserId)
  const selectedUserPaid = selectedUser
    ? selectedUser.paid_override || selectedUser.subscription_status === 'active'
    : true

  // Show payment warning when: real user selected, admin role, not a dream theater, user isn't paid
  const showPaymentWarning = !isEditing
    && !isDreamTheater
    && isAdminRole
    && selectedUserId > 0
    && selectedUser != null
    && !selectedUser.fake
    && !selectedUserPaid

  async function handleGrantAndAdd() {
    if (!selectedUser || selectedUserId <= 0) return
    await updatePaidOverride.mutateAsync({ id: selectedUserId, paid_override: true })
    await form.handleSubmit()
  }

  const isSubmitBlocked = showPaymentWarning && !isSuperAdmin

  return (
    <form
      onSubmit={e => { e.preventDefault(); if (!isSubmitBlocked) form.handleSubmit() }}
      className="space-y-4"
    >
      {isDreamTheater && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          This is a dream theater. Only placeholder actors can be used here.
        </p>
      )}

      <form.Field name="user_id">
        {field => (
          <FormField label="Person">
            <UserCombobox
              users={filteredUsers}
              value={field.state.value}
              onChange={id => field.handleChange(id)}
            />
          </FormField>
        )}
      </form.Field>

      {!specializationId && (
        <form.Field name="specialization_id">
          {field => (
            <FormField label="Role" required>
              <select
                value={field.state.value}
                onChange={e => {
                  const id = Number(e.target.value)
                  field.handleChange(id)
                  applyPhaseDefaults(id)
                }}
                onBlur={field.handleBlur}
                className={inputClass}
              >
                <option value={0}>Select role</option>
                {specializations
                  .sort((a, b) => a.title.localeCompare(b.title))
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
              </select>
            </FormField>
          )}
        </form.Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="start_date">
          {field => (
            <FormField label="Start date">
              <input
                type="date"
                value={field.state.value ?? ''}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>

        <form.Field name="end_date">
          {field => (
            <FormField label="End date">
              <input
                type="date"
                value={field.state.value ?? ''}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>
      </div>

      {showPaymentWarning && (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <p className="font-medium mb-1">Subscription required for admin roles</p>
          <p>
            {selectedUser?.first_name} {selectedUser?.last_name} doesn't have an active subscription.
            Admin roles (director, stage manager, etc.) require a paid membership.{' '}
            {!isSuperAdmin && (
              <Link to={'/subscriptions' as never} className="underline font-medium">
                Subscribe here
              </Link>
            )}
          </p>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={handleGrantAndAdd}
              disabled={updatePaidOverride.isPending || form.state.isSubmitting}
              className="mt-2 px-3 py-1 bg-amber-700 text-white rounded text-xs font-medium hover:bg-amber-800 disabled:opacity-50"
            >
              {updatePaidOverride.isPending ? 'Granting access…' : 'Add anyway (grant paid access)'}
            </button>
          )}
        </div>
      )}

      <FormActions
        isSubmitting={form.state.isSubmitting}
        isEditing={isEditing}
        onCancel={onCancel}
        submitLabel="Add job"
        submitDisabled={isSubmitBlocked}
      />
    </form>
  )
}
