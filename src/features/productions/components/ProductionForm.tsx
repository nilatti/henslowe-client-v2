import { useForm } from '@tanstack/react-form'
import { useStore } from '@tanstack/react-store'
import { useSuspenseQuery, useQuery } from '@tanstack/react-query'
import { canonicalPlaysQueryOptions } from '../../plays/api/plays'
import { theatersQueryOptions, theaterSkeletonQueryOptions } from '../../theaters/api/theaters'
import { useCreateProduction, useUpdateProduction } from '../api/productions'
import { productionJobsQueryOptions } from '../../jobs/api/jobs'
import { getActors, getStaffJobs, getCastings } from '../../jobs/utils/jobUtils'
import type { Production } from '../types/production'
import { FormField, FormActions, inputClass } from '../../../components/ui'
import { useAdminTheaterIds } from '../../../hooks/useUserRole'
import { buildUserName } from '../../../utils/actorUtils'

interface ProductionFormProps {
  production?: Production
  defaultTheaterId?: number
  onSuccess: (id?: number) => void
  onCancel: () => void
}

export function ProductionForm({ production, defaultTheaterId, onSuccess, onCancel }: ProductionFormProps) {
  const { data: plays } = useSuspenseQuery(canonicalPlaysQueryOptions())
  const { data: allTheaters } = useSuspenseQuery(theatersQueryOptions())
  const adminTheaterIds = useAdminTheaterIds()
  const theaters = adminTheaterIds
    ? allTheaters.filter(t => adminTheaterIds.has(t.id))
    : allTheaters
  const create = useCreateProduction()
  const update = useUpdateProduction(production?.id ?? 0)
  const isEditing = !!production
  const theaterIdForSkeleton = production?.theater_id ?? defaultTheaterId
  const { data: theater } = useQuery({
    ...theaterSkeletonQueryOptions(theaterIdForSkeleton ?? 0),
    enabled: !!theaterIdForSkeleton,
  })
  const { data: productionJobs } = useQuery({
    ...productionJobsQueryOptions(production?.id ?? 0),
    enabled: isEditing,
  })

  const form = useForm({
    defaultValues: {
      play_id: production?.play.id ? String(production.play.id) : '',
      theater_id: production?.theater_id
        ? String(production.theater_id)
        : defaultTheaterId
          ? String(defaultTheaterId)
          : '',
      start_date: production?.start_date ?? '',
      end_date: production?.end_date ?? '',
      audition_information: production?.audition_information ?? '',
      lines_per_minute: production?.lines_per_minute
        ? String(production.lines_per_minute)
        : '',
      default_space_id: production?.default_space_id ?? null as number | null,
      default_call_user_ids: production?.default_call_user_ids ?? [] as number[],
    },
    onSubmit: async ({ value }) => {
      const data: Record<string, unknown> = {
        start_date: value.start_date || null,
        end_date: value.end_date || null,
        audition_information: value.audition_information || null,
        lines_per_minute: value.lines_per_minute ? Number(value.lines_per_minute) : null,
      }
      if (!isEditing) {
        data.play_id = value.play_id
        data.theater_id = value.theater_id
      }
      if (isEditing) {
        data.default_space_id = value.default_space_id
        data.default_call_user_ids = value.default_call_user_ids
        await update.mutateAsync(data)
        onSuccess()
      } else {
        const result = await create.mutateAsync(data)
        onSuccess(result.id)
      }
    },
  })

  const selectedTheaterId = useStore(form.store, state => state.values.theater_id)
  const isDreamTheater = isEditing
    ? !!production.theater.fake
    : (theaters.find(t => String(t.id) === selectedTheaterId)?.fake ?? false)

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      {!isEditing && (
        <div className="grid grid-cols-2 gap-4">
          <form.Field name="play_id">
            {field => (
              <FormField label="Play" required>
                <select
                  value={field.state.value}
                  onChange={e => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  required
                  className={inputClass}
                >
                  <option value="">Select a play</option>
                  {plays.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </FormField>
            )}
          </form.Field>

          <form.Field name="theater_id">
            {field => (
              <FormField label="Theater" required>
                <select
                  value={field.state.value}
                  onChange={e => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  required
                  className={inputClass}
                >
                  <option value="">Select a theater</option>
                  {theaters.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </FormField>
            )}
          </form.Field>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="start_date">
          {field => (
            <FormField label="Start date">
              <input
                type="date"
                value={field.state.value}
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
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>
      </div>

      {!isDreamTheater && (
        <form.Field name="audition_information">
          {field => (
            <FormField label="Audition information">
              <textarea
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                rows={4}
                placeholder="What should auditioners know? (requirements, what to prepare, dates, etc.)"
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>
      )}

      <form.Field name="lines_per_minute">
        {field => (
          <div className="w-1/2">
            <FormField label="Lines per minute">
              <input
                type="number"
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                min={0}
                className={inputClass}
              />
            </FormField>
          </div>
        )}
      </form.Field>

      {isEditing && theater && theater.spaces.length > 0 && (
        <form.Field name="default_space_id">
          {field => (
            <FormField label="Default location">
              <select
                value={field.state.value ?? ''}
                onChange={e => field.handleChange(e.target.value ? Number(e.target.value) : null)}
                onBlur={field.handleBlur}
                className={inputClass}
              >
                <option value="">No default</option>
                {theater.spaces.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </FormField>
          )}
        </form.Field>
      )}

      {isEditing && productionJobs && productionJobs.length > 0 && (
        <form.Field name="default_call_user_ids">
          {field => {
            const actors = getActors(productionJobs).filter(u => !u.fake)
            const staffJobs = getStaffJobs(productionJobs).filter(j => j.user && !j.user.fake)
            const productionStaff = Array.from(
              new Map(staffJobs.map(j => [j.user!.id, j.user!])).values()
            )

            const actorCharacterNames = new Map<number, string[]>()
            const castings = getCastings(productionJobs)
            castings.forEach(j => {
              if (j.user && j.character) {
                const existing = actorCharacterNames.get(j.user.id) ?? []
                actorCharacterNames.set(j.user.id, [...existing, j.character.name])
              }
            })
            const seenGroups = new Map<number, Set<string>>()
            castings.forEach(j => {
              if (!j.user || !j.character_group) return
              const groups = seenGroups.get(j.user.id) ?? new Set<string>()
              if (!groups.has(j.character_group.name)) {
                groups.add(j.character_group.name)
                const existing = actorCharacterNames.get(j.user.id) ?? []
                actorCharacterNames.set(j.user.id, [...existing, j.character_group.name])
              }
              seenGroups.set(j.user.id, groups)
            })

            const staffTitlesByUserId = new Map<number, string[]>()
            staffJobs.forEach(j => {
              if (!j.user || !j.specialization?.title) return
              const existing = staffTitlesByUserId.get(j.user.id) ?? []
              if (!existing.includes(j.specialization.title)) {
                staffTitlesByUserId.set(j.user.id, [...existing, j.specialization.title])
              }
            })

            const renderRow = (
              u: NonNullable<(typeof productionJobs)[number]['user']>,
              roleLabel?: string,
            ) => (
              <label
                key={u.id}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={field.state.value.includes(u.id)}
                  onChange={e => {
                    if (e.target.checked) {
                      field.handleChange([...field.state.value, u.id])
                    } else {
                      field.handleChange(field.state.value.filter((id: number) => id !== u.id))
                    }
                  }}
                />
                {buildUserName(u)}
                {roleLabel ? ` (${roleLabel})` : null}
              </label>
            )

            return (
              <FormField label="Default calls">
                <div className="border border-gray-300 rounded-md max-h-96 overflow-y-auto">
                  <h5 className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">Actors</h5>
                  {[...actors]
                    .sort((a, b) => a.last_name.localeCompare(b.last_name))
                    .map(u => renderRow(u, actorCharacterNames.get(u.id)?.join(', ')))}
                  <h5 className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">Production staff</h5>
                  {[...productionStaff]
                    .sort((a, b) => a.last_name.localeCompare(b.last_name))
                    .map(u => renderRow(u, staffTitlesByUserId.get(u.id)?.join(', ')))}
                </div>
              </FormField>
            )
          }}
        </form.Field>
      )}

      <FormActions isSubmitting={form.state.isSubmitting} isEditing={isEditing} onCancel={onCancel} submitLabel="Create production" />
    </form>
  )
}
