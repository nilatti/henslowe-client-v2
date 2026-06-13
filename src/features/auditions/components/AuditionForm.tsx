import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useAuth } from '../../../hooks/useAuth'
import { userQueryOptions } from '../../users/api/users'
import { useCreateAuditionerJob, useUpdateAuditionerContact } from '../api/auditions'
import { Button } from '../../../components/ui'

interface ContactFields {
  preferred_name: string
  phone_number: string
  street_address: string
  city: string
  state: string
  zip: string
  emergency_contact_name: string
  emergency_contact_number: string
}

interface Props {
  productionId: number
  playTitle: string | null
  theaterName: string | null
}

export function AuditionForm({ productionId, playTitle, theaterName }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)

  const { data: profile } = useSuspenseQuery(userQueryOptions(user!.id))

  const createJob = useCreateAuditionerJob(productionId)
  const updateContact = useUpdateAuditionerContact(user!.id)

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<ContactFields>({
    defaultValues: {
      preferred_name: profile.preferred_name ?? '',
      phone_number: profile.phone_number ?? '',
      street_address: profile.street_address ?? '',
      city: profile.city ?? '',
      state: profile.state ?? '',
      zip: profile.zip ?? '',
      emergency_contact_name: profile.emergency_contact_name ?? '',
      emergency_contact_number: profile.emergency_contact_number ?? '',
    },
  })

  async function onSubmit(data: ContactFields) {
    await createJob.mutateAsync(user!.id)
    const contactData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== '')
    )
    if (Object.keys(contactData).length > 0) {
      await updateContact.mutateAsync(contactData)
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-lg font-medium text-gray-900">You're signed up to audition!</p>
        <p className="text-sm text-gray-600">
          {theaterName} will be in touch about {playTitle ?? 'this production'}.
        </p>
        <Button variant="secondary" onClick={() => navigate({ to: '/' })}>
          Go to your dashboard
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <p className="text-sm text-gray-600">
        Signing up to audition for <span className="font-medium">{playTitle ?? 'this production'}</span>
        {theaterName ? ` at ${theaterName}` : ''}.
        Fill in your contact info so the production team can reach you.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred name</label>
          <input
            {...register('preferred_name')}
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
          <input
            {...register('phone_number')}
            type="tel"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Street address</label>
          <input
            {...register('street_address')}
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            {...register('city')}
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              {...register('state')}
              type="text"
              maxLength={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zip</label>
            <input
              {...register('zip')}
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Emergency contact name</label>
          <input
            {...register('emergency_contact_name')}
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Emergency contact number</label>
          <input
            {...register('emergency_contact_number')}
            type="tel"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {(createJob.isError || updateContact.isError) && (
        <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting…' : 'Submit audition'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate({ to: '/auditions' })}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
