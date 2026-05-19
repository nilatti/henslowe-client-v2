import { useForm } from '@tanstack/react-form'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useCreateSpace, useUpdateSpace } from '../api/spaces'
import type { SpaceDetail } from '../types/space'
import { theatersQueryOptions } from '../../theaters/api/theaters'
import { Button } from '../../../components/ui'
import { US_STATES_ARRAY } from '../../../utils/constants'

interface SpaceFormProps {
  space?: SpaceDetail
  onSuccess: () => void
  onCancel: () => void
}

export function SpaceForm({ space, onSuccess, onCancel }: SpaceFormProps) {
  const create = useCreateSpace()
  const update = useUpdateSpace()
  const { data: theaters } = useSuspenseQuery(theatersQueryOptions())
  const isEditing = !!space

  const form = useForm({
    defaultValues: {
      name: space?.name ?? '',
      street_address: space?.street_address ?? '',
      city: space?.city ?? '',
      state: space?.state ?? '',
      zip: space?.zip ?? '',
      phone_number: space?.phone_number ?? '',
      website: space?.website ?? '',
      seating_capacity: space?.seating_capacity ?? '',
      mission_statement: space?.mission_statement ?? '',
      theater_ids: space?.theaters.map(t => t.id) ?? [],
    },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        seating_capacity: value.seating_capacity
          ? Number(value.seating_capacity)
          : null,
      }
      if (isEditing) {
        await update.mutateAsync({ ...space, ...payload })
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
      <form.Field name="name">
        {field => (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Space name *
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

      <form.Field name="theater_ids">
        {field => (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Associated theaters
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
              {theaters
                .filter(t => !t.fake)
                .map(theater => (
                  <label
                    key={theater.id}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={field.state.value.includes(theater.id)}
                      onChange={e => {
                        const ids = field.state.value
                        if (e.target.checked) {
                          field.handleChange([...ids, theater.id])
                        } else {
                          field.handleChange(ids.filter(id => id !== theater.id))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    {theater.name}
                  </label>
                ))}
            </div>
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

        <form.Field name="seating_capacity">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seating capacity
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

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.state.isSubmitting}>
          {form.state.isSubmitting
            ? 'Saving...'
            : isEditing ? 'Save changes' : 'Create space'}
        </Button>
      </div>
    </form>
  )
}
