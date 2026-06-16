import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useSuspenseQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { useAuth } from '../../../hooks/useAuth'
import { userQueryOptions } from '../../users/api/users'
import { useCreateAuditionerJob, useUpdateAuditionerContact } from '../api/auditions'
import { ConflictsManager } from '../../conflicts/components/ConflictsManager'
import { Button } from '../../../components/ui'
import { US_STATES_ARRAY, USER_GENDER_DESCRIPTORS } from '../../../utils/constants'

interface Props {
  productionId: number
  playTitle: string | null
  theaterName: string | null
  rehearsalStartDate: string | null
  runEndDate: string | null
}

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

function formatPhaseDate(d: string | null) {
  if (!d) return null
  try { return format(parseISO(d), 'MMM d, yyyy') } catch { return null }
}

export function AuditionForm({ productionId, playTitle, theaterName, rehearsalStartDate, runEndDate }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(false)

  const { data: profile } = useSuspenseQuery(userQueryOptions(user!.id))

  const createJob = useCreateAuditionerJob(productionId)
  const updateContact = useUpdateAuditionerContact(user!.id)

  const existingSubmission = profile.jobs?.find(
    j => j.production_id === productionId && j.specialization?.title === 'Auditioner'
  )?.audition_submission

  const form = useForm({
    defaultValues: {
      first_name: profile.first_name ?? '',
      middle_name: profile.middle_name ?? '',
      last_name: profile.last_name ?? '',
      email: profile.email ?? '',
      phone_number: profile.phone_number ?? '',
      website: profile.website ?? '',
      street_address: profile.street_address ?? '',
      city: profile.city ?? '',
      state: profile.state ?? '',
      zip: profile.zip ?? '',
      gender: profile.gender ?? '',
      timezone: profile.timezone ?? '',
      bio: profile.bio ?? '',
      emergency_contact_name: profile.emergency_contact_name ?? '',
      emergency_contact_number: profile.emergency_contact_number ?? '',
      video_url: existingSubmission?.video_url ?? '',
      notes: existingSubmission?.notes ?? '',
    },
    onSubmit: async ({ value }) => {
      setError(false)
      try {
        const { video_url, notes, ...contactFields } = value
        await createJob.mutateAsync({ video_url: video_url || undefined, notes: notes || undefined })
        const contactData = Object.fromEntries(
          Object.entries(contactFields).filter(([, v]) => v !== '')
        )
        if (Object.keys(contactData).length > 0) {
          await updateContact.mutateAsync(contactData)
        }
        setSubmitted(true)
      } catch {
        setError(true)
      }
    },
  })

  if (submitted) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-lg font-medium text-gray-900">You're signed up to audition!</p>
        <p className="text-sm text-gray-600">
          {theaterName} will be in touch about {playTitle ?? 'this production'}.
        </p>
        <Button variant="secondary" onClick={() => navigate({ to: '/auditions' })}>
          Back to open auditions
        </Button>
      </div>
    )
  }

  const textField = (name: Parameters<typeof form.Field>[0]['name'], label: string, placeholder?: string) => (
    <form.Field name={name}>
      {field => (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input
            value={field.state.value as string}
            onChange={e => field.handleChange(e.target.value as never)}
            onBlur={field.handleBlur}
            placeholder={placeholder}
            className={inputClass}
          />
        </div>
      )}
    </form.Field>
  )

  return (
    <form
      onSubmit={e => { e.preventDefault(); form.handleSubmit() }}
      className="space-y-6"
    >
      <p className="text-sm text-gray-600">
        Signing up to audition for <span className="font-medium">{playTitle ?? 'this production'}</span>
        {theaterName ? ` at ${theaterName}` : ''}.
        Fill in your details so the production team can reach you.
      </p>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Name</h3>
        <div className="grid grid-cols-3 gap-4">
          {textField('first_name', 'First name')}
          {textField('middle_name', 'Middle name')}
          {textField('last_name', 'Last name')}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          {textField('email', 'Email')}
          {textField('phone_number', 'Phone')}
          {textField('website', 'Website', 'https://')}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
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
              </div>
            )}
          </form.Field>
          {textField('zip', 'Zip')}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Personal</h3>
        <div className="grid grid-cols-2 gap-4">
          <form.Field name="gender">
            {field => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
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
              </div>
            )}
          </form.Field>
          {textField('timezone', 'Timezone', 'e.g. America/New_York')}
        </div>
        <div className="mt-4">
          <form.Field name="bio">
            {field => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={field.state.value}
                  onChange={e => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  rows={3}
                  className={inputClass}
                />
              </div>
            )}
          </form.Field>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Audition materials</h3>
        <div className="space-y-4">
          {textField('video_url', 'Video audition link', 'https://')}
          <form.Field name="notes">
            {field => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={field.state.value}
                  onChange={e => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  rows={3}
                  placeholder="Anything you'd like the production team to know"
                  className={inputClass}
                />
              </div>
            )}
          </form.Field>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Emergency contact</h3>
        <div className="grid grid-cols-2 gap-4">
          {textField('emergency_contact_name', 'Name')}
          {textField('emergency_contact_number', 'Phone')}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Scheduling conflicts</h3>
        <p className="text-xs text-gray-500 mb-3">
          {(() => {
            const start = formatPhaseDate(rehearsalStartDate)
            const end = formatPhaseDate(runEndDate)
            return start && end
              ? `Let the production team know when you're unavailable — add one-off dates or recurring weekly patterns between ${start} and ${end}.`
              : "Let the production team know when you're unavailable — add one-off dates or recurring weekly patterns."
          })()}
        </p>
        <ConflictsManager userId={user!.id} canEdit={true} />
      </div>

      {error && <p className="text-sm text-red-600">Something went wrong. Please try again.</p>}

      <form.Subscribe selector={state => state.isSubmitting}>
        {isSubmitting => (
          <div className="flex gap-3 pt-2 border-t border-gray-200">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit audition'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate({ to: '/auditions' })}>
              Cancel
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  )
}
