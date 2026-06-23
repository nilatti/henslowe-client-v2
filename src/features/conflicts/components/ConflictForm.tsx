import { useForm } from '@tanstack/react-form'
import { format } from 'date-fns'
import { useCreateConflict, useUpdateConflict } from '../api/conflicts'
import type { Conflict } from '../types/conflict'
import { FormField, FormActions, inputClass } from '../../../components/ui'
import { USER_CONFLICT_REASONS, SPACE_CONFLICT_REASONS } from '../../../utils/constants'
import { firstLetterUpcase } from '../../../utils/stringUtils'

interface ConflictFormProps {
  conflict?: Conflict
  userId?: number
  spaceId?: number
  invalidateKey: unknown[]
  onSuccess: () => void
  onCancel: () => void
}

function toLocalInput(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm")
}

export function ConflictForm({
  conflict,
  userId,
  spaceId,
  invalidateKey,
  onSuccess,
  onCancel,
}: ConflictFormProps) {
  const create = useCreateConflict(invalidateKey, userId, spaceId)
  const update = useUpdateConflict(invalidateKey)
  const isEditing = !!conflict
  const reasons = userId ? USER_CONFLICT_REASONS : SPACE_CONFLICT_REASONS
  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm")

  const form = useForm({
    defaultValues: {
      start_time: conflict?.start_time ? toLocalInput(conflict.start_time) : now,
      end_time: conflict?.end_time ? toLocalInput(conflict.end_time) : now,
      category: conflict?.category ?? '',
    },
    onSubmit: async ({ value }) => {
      const payload: Partial<Conflict> = {
        ...value,
        start_time: new Date(value.start_time).toISOString(),
        end_time: new Date(value.end_time).toISOString(),
        user_id: userId ?? null,
        space_id: spaceId ?? null,
      }
      if (isEditing) {
        await update.mutateAsync({ ...conflict, ...payload } as Conflict)
      } else {
        await create.mutateAsync(payload)
      }
      onSuccess()
    },
  })

  return (
    <form
      onSubmit={e => { e.preventDefault(); form.handleSubmit() }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <form.Field name="start_time">
          {field => (
            <FormField label="Start" required>
              <input
                type="datetime-local"
                value={field.state.value}
                onChange={e => {
                  const val = e.target.value
                  field.handleChange(val)
                  if (val > form.getFieldValue('end_time')) {
                    form.setFieldValue('end_time', val)
                  }
                }}
                onBlur={field.handleBlur}
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>

        <form.Field
          name="end_time"
          validators={{
            onChange: ({ value }) =>
              value < form.getFieldValue('start_time')
                ? 'End time must be after start time'
                : undefined,
            onChangeListenTo: ['start_time'],
          }}
        >
          {field => (
            <FormField label="End" required error={field.state.meta.errors[0] as string | undefined}>
              <input
                type="datetime-local"
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${field.state.meta.errors.length ? 'border-red-500' : 'border-gray-300'}`}
              />
            </FormField>
          )}
        </form.Field>
      </div>

      <form.Field name="category">
        {field => (
          <FormField label="Category" required>
            <div className="flex flex-wrap gap-3">
              {reasons.map(reason => (
                <label
                  key={reason}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="radio"
                    name="conflict_category"
                    value={reason}
                    checked={field.state.value === reason}
                    onChange={() => field.handleChange(reason)}
                    className="border-gray-300"
                  />
                  {firstLetterUpcase(reason)}
                </label>
              ))}
            </div>
          </FormField>
        )}
      </form.Field>

      <FormActions isSubmitting={form.state.isSubmitting} isEditing={isEditing} onCancel={onCancel} submitLabel="Add conflict" />
    </form>
  )
}
