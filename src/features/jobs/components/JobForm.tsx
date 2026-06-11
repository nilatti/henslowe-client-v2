import { useForm } from '@tanstack/react-form'
import { useStore } from '@tanstack/react-store'
import { useSuspenseQuery, useQuery } from '@tanstack/react-query'
import { useCreateJob, useUpdateJob, productionJobsQueryOptions } from '../api/jobs'
import { specializationsQueryOptions } from '../../specializations/queries'
import { usersQueryOptions } from '../../users/api/users'
import { productionSkeletonQueryOptions } from '../../productions/api/productions'
import { AUDITIONER_SPECIALIZATION_ID } from '../../../utils/constants'
import type { Job, JobWithDetails } from '../types/job'
import { Button } from '../../../components/ui'
import { useAuth } from '../../../hooks/useAuth'
import { UserCombobox } from './UserCombobox'
import { format } from 'date-fns'

interface JobFormProps {
  job?: JobWithDetails
  productionId?: number
  theaterId?: number
  specializationId?: number
  invalidateKey: unknown[]
  onSuccess: () => void
  onCancel: () => void
}

export function JobForm({
  job,
  productionId,
  theaterId,
  specializationId,
  invalidateKey,
  onSuccess,
  onCancel,
}: JobFormProps) {
  const create = useCreateJob(invalidateKey)
  const update = useUpdateJob(invalidateKey)
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
  const usersTyped = users as (typeof users[number] & { fake?: boolean })[]
  const availableUsers = (isAuditionerJob && !isSubscribed && !isSuperAdmin)
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

  return (
    <form
      onSubmit={e => { e.preventDefault(); form.handleSubmit() }}
      className="space-y-4"
    >
      <form.Field name="user_id">
        {field => (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Person
            </label>
            <UserCombobox
              users={filteredUsers}
              value={field.state.value}
              onChange={id => field.handleChange(id)}
            />
          </div>
        )}
      </form.Field>

      {!specializationId && (
        <form.Field name="specialization_id">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                value={field.state.value}
                onChange={e => {
                  const id = Number(e.target.value)
                  field.handleChange(id)
                  applyPhaseDefaults(id)
                }}
                onBlur={field.handleBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            </div>
          )}
        </form.Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="start_date">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start date
              </label>
              <input
                type="date"
                value={field.state.value ?? ''}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </form.Field>

        <form.Field name="end_date">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End date
              </label>
              <input
                type="date"
                value={field.state.value ?? ''}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </form.Field>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.state.isSubmitting}>
          {form.state.isSubmitting ? 'Saving...' : isEditing ? 'Save changes' : 'Add job'}
        </Button>
      </div>
    </form>
  )
}
