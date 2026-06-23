import { useForm } from '@tanstack/react-form'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useCreateSpace, useUpdateSpace } from '../api/spaces'
import type { SpaceDetail } from '../types/space'
import { theatersQueryOptions } from '../../theaters/api/theaters'
import { FormField, FormActions, inputClass } from '../../../components/ui'
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
          <FormField label="Space name" required>
            <input
              value={field.state.value}
              onChange={e => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              className={inputClass}
            />
          </FormField>
        )}
      </form.Field>

      <form.Field name="theater_ids">
        {field => (
          <FormField label="Associated theaters">
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
          </FormField>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="street_address">
          {field => (
            <FormField label="Street address">
              <input
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>

        <form.Field name="city">
          {field => (
            <FormField label="City">
              <input
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="state">
          {field => (
            <FormField label="State">
              <select
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className={inputClass}
              >
                <option value="">Select state</option>
                {US_STATES_ARRAY.map(s => (
                  <option key={s.abbr} value={s.abbr}>{s.name}</option>
                ))}
              </select>
            </FormField>
          )}
        </form.Field>

        <form.Field name="zip">
          {field => (
            <FormField label="Zip">
              <input
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="phone_number">
          {field => (
            <FormField label="Phone">
              <input
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>

        <form.Field name="seating_capacity">
          {field => (
            <FormField label="Seating capacity">
              <input
                type="number"
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>
      </div>

      <form.Field name="website">
        {field => (
          <FormField label="Website">
            <input
              value={field.state.value}
              onChange={e => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="https://"
              className={inputClass}
            />
          </FormField>
        )}
      </form.Field>

      <form.Field name="mission_statement">
        {field => (
          <FormField label="Mission statement">
            <textarea
              value={field.state.value}
              onChange={e => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              rows={3}
              className={inputClass}
            />
          </FormField>
        )}
      </form.Field>

      <FormActions isSubmitting={form.state.isSubmitting} isEditing={isEditing} onCancel={onCancel} submitLabel="Create space" />
    </form>
  )
}
