import { useForm } from '@tanstack/react-form'
import { useUpdateUser } from '../api/users'
import type { UserDetail, UserEditableFields } from '../types/user'
import { FormField, FormActions, inputClass } from '../../../components/ui'
import {
  US_STATES_ARRAY,
  USER_GENDER_DESCRIPTORS,
} from '../../../utils/constants'

interface UserFormProps {
  user: UserDetail & { id: number }
  onSuccess: () => void
  onCancel: () => void
}

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const update = useUpdateUser()

  const form = useForm({
    defaultValues: {
      first_name: user.first_name ?? '',
      middle_name: user.middle_name ?? '',
      last_name: user.last_name ?? '',
      preferred_name: user.preferred_name ?? '',
      program_name: user.program_name ?? '',
      email: user.email ?? '',
      phone_number: user.phone_number ?? '',
      birthdate: user.birthdate ?? '',
      gender: user.gender ?? '',
      bio: user.bio ?? '',
      description: user.description ?? '',
      street_address: user.street_address ?? '',
      city: user.city ?? '',
      state: user.state ?? '',
      zip: user.zip ?? '',
      website: user.website ?? '',
      timezone: user.timezone ?? '',
      emergency_contact_name: user.emergency_contact_name ?? '',
      emergency_contact_number: user.emergency_contact_number ?? '',
      receive_rehearsal_calendar_invites: user.receive_rehearsal_calendar_invites ?? true,
    } as UserEditableFields,
    onSubmit: async ({ value }) => {
      await update.mutateAsync({ ...value, id: user.id })
      onSuccess()
    },
  })

  const textField = (
    name: Exclude<keyof UserEditableFields, 'receive_rehearsal_calendar_invites'>,
    label: string,
    placeholder?: string
  ) => (
    <form.Field name={name}>
      {field => (
        <FormField label={label}>
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
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Name
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {textField('first_name', 'First name')}
          {textField('middle_name', 'Middle name')}
          {textField('last_name', 'Last name')}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {textField('preferred_name', 'Preferred name')}
          {textField('program_name', 'Name for programs')}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Contact
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {textField('email', 'Email')}
          {textField('phone_number', 'Phone')}
          {textField('website', 'Website', 'https://')}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Address
        </h3>
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
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Personal
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {textField('birthdate', 'Date of birth', 'YYYY-MM-DD')}
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
          <form.Field name="timezone">
            {field => (
              <FormField label="Timezone">
                <input
                  value={field.state.value}
                  onChange={e => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="e.g. America/New_York"
                  className={inputClass}
                />
              </FormField>
            )}
          </form.Field>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Bio &amp; Description
        </h3>
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
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Emergency Contact
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {textField('emergency_contact_name', 'Name')}
          {textField('emergency_contact_number', 'Phone number')}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Notifications
        </h3>
        <form.Field name="receive_rehearsal_calendar_invites">
          {field => (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={field.state.value}
                onChange={e => field.handleChange(e.target.checked)}
              />
              Email me calendar invites for rehearsals
            </label>
          )}
        </form.Field>
      </div>

      <FormActions isSubmitting={form.state.isSubmitting} isEditing={true} onCancel={onCancel} className="border-t border-gray-200" />
    </form>
  )
}
