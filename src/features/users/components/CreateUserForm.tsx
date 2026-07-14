import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { useCreateUser } from '../api/users'
import { Button, ErrorMessage, FormField, inputClass } from '../../../components/ui'
import {
  US_STATES_ARRAY,
  USER_GENDER_DESCRIPTORS,
} from '../../../utils/constants'
import type { UserEditableFields } from '../types/user'

export function CreateUserForm() {
  const create = useCreateUser()
  const navigate = useNavigate()

  const form = useForm({
    defaultValues: {
      first_name: '',
      middle_name: '',
      last_name: '',
      preferred_name: '',
      program_name: '',
      email: '',
      phone_number: '',
      birthdate: '',
      gender: '',
      bio: '',
      description: '',
      street_address: '',
      city: '',
      state: '',
      zip: '',
      website: '',
      timezone: '',
      emergency_contact_name: '',
      emergency_contact_number: '',
      receive_rehearsal_calendar_invites: true,
    } as UserEditableFields,
    onSubmit: async ({ value }) => {
      const user = await create.mutateAsync(value)
      navigate({ to: '/users/$userId', params: { userId: String(user.id) } })
    },
  })

  const textField = (
    name: Exclude<keyof UserEditableFields, 'receive_rehearsal_calendar_invites'>,
    label: string,
    required = false,
    placeholder?: string
  ) => (
    <form.Field
      name={name}
      validators={required ? { onChange: ({ value }) => value ? undefined : `${label} is required` } : undefined}
    >
      {field => (
        <FormField label={label} required={required} error={field.state.meta.errors[0] as string | undefined}>
          <input
            value={field.state.value}
            onChange={e => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            placeholder={placeholder}
            className={inputClass}
          />
        </FormField>
      )}
    </form.Field>
  )

  return (
    <form
      onSubmit={e => { e.preventDefault(); form.handleSubmit() }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Name</h3>
        <div className="grid grid-cols-3 gap-4">
          {textField('first_name', 'First name', true)}
          {textField('middle_name', 'Middle name')}
          {textField('last_name', 'Last name', true)}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {textField('preferred_name', 'Preferred name')}
          {textField('program_name', 'Name for programs')}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          {textField('email', 'Email', true)}
          {textField('phone_number', 'Phone')}
          {textField('website', 'Website', false, 'https://')}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Address</h3>
        <div className="grid grid-cols-2 gap-4">
          {textField('street_address', 'Street address')}
          {textField('city', 'City')}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
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
          {textField('zip', 'Zip')}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Personal</h3>
        <div className="grid grid-cols-2 gap-4">
          {textField('birthdate', 'Date of birth', false, 'YYYY-MM-DD')}
          <form.Field name="gender">
            {field => (
              <FormField label="Gender">
                <select
                  value={field.state.value}
                  onChange={e => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className={inputClass}
                >
                  <option value="">Prefer not to say</option>
                  {USER_GENDER_DESCRIPTORS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </FormField>
            )}
          </form.Field>
        </div>
        <div className="mt-4">
          {textField('timezone', 'Timezone', false, 'e.g. America/New_York')}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Bio &amp; Description</h3>
        <div className="space-y-4">
          <form.Field name="bio">
            {field => (
              <FormField label="Bio">
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
          <form.Field name="description">
            {field => (
              <FormField label="Description">
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
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Emergency Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          {textField('emergency_contact_name', 'Name')}
          {textField('emergency_contact_number', 'Phone number')}
        </div>
      </div>

      {create.error && (
        <ErrorMessage message={(create.error as Error).message || 'Failed to create person'} />
      )}

      <div className="flex gap-3 justify-end pt-2 border-t border-gray-200">
        <Button
          variant="secondary"
          type="button"
          onClick={() => navigate({ to: '/users' })}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={form.state.isSubmitting}>
          {form.state.isSubmitting ? 'Creating...' : 'Create person'}
        </Button>
      </div>
    </form>
  )
}
