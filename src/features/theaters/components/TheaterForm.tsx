import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useCreateTheater, useUpdateTheater } from '../api/theaters'
import type { Theater } from '../types/theater'
import { FormField, FormActions, inputClass } from '../../../components/ui'
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
          <FormField label="Theater name" required>
            <input
              value={field.state.value}
              onChange={e => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              required
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
      </div>

      <form.Field name="calendar_url">
        {field => (
          <FormField label="Calendar URL">
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

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <FormActions isSubmitting={form.state.isSubmitting} isEditing={isEditing} onCancel={onCancel} submitLabel="Create theater" />
    </form>
  )
}
