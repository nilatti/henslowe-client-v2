import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useCreateTheater, useUpdateTheater } from '../api/theaters'
import type { Theater } from '../types/theater'
import { Button } from '../../../components/ui'
import { US_STATES_ARRAY } from '../../../utils/constants'

interface TheaterFormProps {
  theater?: Theater
  onSuccess: (id?: number) => void
  onCancel: () => void
}

export function TheaterForm({ theater, onSuccess, onCancel }: TheaterFormProps) {
  const create = useCreateTheater()
  const update = useUpdateTheater()
  const isEditing = !!theater
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      name: theater?.name ?? '',
      street_address: theater?.street_address ?? '',
      city: theater?.city ?? '',
      state: theater?.state ?? '',
      zip: theater?.zip ?? '',
      phone_number: theater?.phone_number ?? '',
      mission_statement: theater?.mission_statement ?? '',
      website: theater?.website ?? '',
      calendar_url: theater?.calendar_url ?? '',
    },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        if (isEditing) {
          await update.mutateAsync({ ...theater, ...value })
          onSuccess()
        } else {
          const created = await create.mutateAsync(value)
          onSuccess((created as Theater).id)
        }
      } catch {
        setError('Failed to save. Please try again.')
      }
    },
  })

  return (
    <form
      onSubmit={e => { e.preventDefault(); form.handleSubmit() }}
      className="space-y-4"
    >
      <form.Field name="name">
        {field => (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Theater name <span className="text-red-500">*</span>
            </label>
            <input
              value={field.state.value}
              onChange={e => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </form.Field>

      <form.Field name="mission_statement">
        {field => (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mission statement
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
        <form.Field name="street_address">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street address
              </label>
              <input
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </form.Field>

        <form.Field name="city">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="state">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select state</option>
                {US_STATES_ARRAY.map(s => (
                  <option key={s.abbr} value={s.abbr}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </form.Field>

        <form.Field name="zip">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zip
              </label>
              <input
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="phone_number">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </form.Field>

        <form.Field name="website">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="https://"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="calendar_url">
        {field => (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calendar URL
            </label>
            <input
              value={field.state.value}
              onChange={e => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="https://"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </form.Field>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.state.isSubmitting}>
          {form.state.isSubmitting
            ? 'Saving...'
            : isEditing ? 'Save changes' : 'Create theater'}
        </Button>
      </div>
    </form>
  )
}
