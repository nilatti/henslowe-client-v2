import { useForm } from '@tanstack/react-form'
import { useSuspenseQuery } from '@tanstack/react-query'
import { playsQueryOptions } from '../../plays/api/plays'
import { theatersQueryOptions } from '../../theaters/api/theaters'
import { useCreateProduction, useUpdateProduction } from '../api/productions'
import type { Production } from '../types/production'
import { Button } from '../../../components/ui'

interface ProductionFormProps {
  production?: Production
  onSuccess: (id?: number) => void
  onCancel: () => void
}

export function ProductionForm({ production, onSuccess, onCancel }: ProductionFormProps) {
  const { data: plays } = useSuspenseQuery(playsQueryOptions())
  const { data: theaters } = useSuspenseQuery(theatersQueryOptions())
  const create = useCreateProduction()
  const update = useUpdateProduction(production?.id ?? 0)
  const isEditing = !!production

  const canonicalPlays = plays.filter(p => p.canonical)

  const form = useForm({
    defaultValues: {
      play_id: production?.play.id ? String(production.play.id) : '',
      theater_id: production?.theater_id ? String(production.theater_id) : '',
      start_date: production?.start_date ?? '',
      end_date: production?.end_date ?? '',
      lines_per_minute: production?.lines_per_minute
        ? String(production.lines_per_minute)
        : '',
    },
    onSubmit: async ({ value }) => {
      const data: Record<string, unknown> = {
        start_date: value.start_date || null,
        end_date: value.end_date || null,
        lines_per_minute: value.lines_per_minute ? Number(value.lines_per_minute) : null,
      }
      if (!isEditing) {
        data.play_id = value.play_id
        data.theater_id = value.theater_id
      }
      if (isEditing) {
        await update.mutateAsync(data)
        onSuccess()
      } else {
        const result = await create.mutateAsync(data)
        onSuccess(result.id)
      }
    },
  })

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Play <span className="text-red-500">*</span>
                </label>
                <select
                  value={field.state.value}
                  onChange={e => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  required
                  className={inputClass}
                >
                  <option value="">Select a play</option>
                  {canonicalPlays.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </form.Field>

          <form.Field name="theater_id">
            {field => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Theater <span className="text-red-500">*</span>
                </label>
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
              </div>
            )}
          </form.Field>
        </div>
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
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className={inputClass}
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
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className={inputClass}
              />
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="lines_per_minute">
        {field => (
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lines per minute
            </label>
            <input
              type="number"
              value={field.state.value}
              onChange={e => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              min={0}
              className={inputClass}
            />
          </div>
        )}
      </form.Field>

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.state.isSubmitting}>
          {form.state.isSubmitting
            ? 'Saving...'
            : isEditing
              ? 'Save changes'
              : 'Create production'}
        </Button>
      </div>
    </form>
  )
}
