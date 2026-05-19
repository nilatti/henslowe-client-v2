import { useForm } from '@tanstack/react-form'
import { useCreateAct, useUpdateAct } from '../api/acts'
import type { Act } from '../types/act'
import { Button } from '../../../components/ui'

interface ActFormProps {
  playId: number
  act?: Act
  nextNumber?: number
  onSuccess: () => void
  onCancel: () => void
}

export function ActForm({
  playId,
  act,
  nextNumber = 1,
  onSuccess,
  onCancel,
}: ActFormProps) {
  const create = useCreateAct(playId)
  const update = useUpdateAct(playId)
  const isEditing = !!act

  const form = useForm({
    defaultValues: {
      number: act?.number ?? nextNumber,
      heading: act?.heading ?? '',
      summary: act?.summary ?? '',
      start_page: act?.start_page ?? '',
      end_page: act?.end_page ?? '',
    },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        play_id: playId,
        number: Number(value.number),
        start_page: value.start_page ? Number(value.start_page) : null,
        end_page: value.end_page ? Number(value.end_page) : null,
        heading: value.heading || null,
        summary: value.summary || null,
      }
      if (isEditing) {
        await update.mutateAsync({ ...act, ...payload })
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
        <form.Field name="number">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Act number *
              </label>
              <input
                type="number"
                value={field.state.value}
                onChange={e => field.handleChange(Number(e.target.value))}
                onBlur={field.handleBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </form.Field>

        <form.Field name="heading">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heading
              </label>
              <input
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="e.g. The Garden"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="summary">
        {field => (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Summary
            </label>
            <textarea
              value={field.state.value}
              onChange={e => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="start_page">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start page
              </label>
              <input
                type="number"
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </form.Field>

        <form.Field name="end_page">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End page
              </label>
              <input
                type="number"
                value={field.state.value}
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
          {form.state.isSubmitting
            ? 'Saving...'
            : isEditing ? 'Save changes' : 'Create act'}
        </Button>
      </div>
    </form>
  )
}
