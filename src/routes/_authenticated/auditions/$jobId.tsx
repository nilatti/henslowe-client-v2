import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { jobQueryOptions } from '../../../features/jobs/api/jobs'
import { productionSkeletonQueryOptions } from '../../../features/productions/api/productions'
import { useCreateAuditionerJob } from '../../../features/auditions/api/auditions'
import { useAuth } from '../../../hooks/useAuth'
import { buildUserName } from '../../../utils/actorUtils'
import { Button, PageHeader } from '../../../components/ui'

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

export const Route = createFileRoute('/_authenticated/auditions/$jobId')({
  loader: async ({ params, context: { queryClient } }) => {
    const job = await queryClient.ensureQueryData(jobQueryOptions(Number(params.jobId)))
    if (job.production_id) {
      await queryClient.ensureQueryData(productionSkeletonQueryOptions(job.production_id))
    }
  },
  component: function AuditionDetailRoute() {
    const { jobId } = Route.useParams()
    const { user: authUser } = useAuth()
    const qc = useQueryClient()
    const { data: job } = useSuspenseQuery(jobQueryOptions(Number(jobId)))
    const { data: production } = useQuery({
      ...productionSkeletonQueryOptions(job.production_id ?? 0),
      enabled: !!job.production_id,
    })

    const [isEditing, setIsEditing] = useState(false)
    const [videoUrl, setVideoUrl] = useState('')
    const [notes, setNotes] = useState('')
    const [saveError, setSaveError] = useState(false)

    const user = job.user
    const sub = job.audition_submission
    const playTitle = job.production?.play?.title ?? 'Production'
    const productionId = job.production_id
    const isOwner = authUser?.id === job.user_id

    const phases = production?.production_phases ?? []

    const updateMutation = useCreateAuditionerJob(productionId!)

    function startEditing() {
      setVideoUrl(sub?.video_url ?? '')
      setNotes(sub?.notes ?? '')
      setSaveError(false)
      setIsEditing(true)
    }

    async function handleSave(e: React.FormEvent) {
      e.preventDefault()
      setSaveError(false)
      try {
        await updateMutation.mutateAsync({
          video_url: videoUrl || undefined,
          notes: notes || undefined,
        })
        qc.invalidateQueries({ queryKey: ['jobs', Number(jobId)] })
        setIsEditing(false)
      } catch {
        setSaveError(true)
      }
    }

    return (
      <div>
        <div className="mb-2 flex gap-2 text-sm">
          {isOwner ? (
            <Link to="/" className="text-blue-600 hover:text-blue-800">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/productions" className="text-blue-600 hover:text-blue-800">
                Productions
              </Link>
              <span className="text-gray-400">→</span>
              {productionId && (
                <Link
                  to="/productions/$productionId/people"
                  params={{ productionId: String(productionId) }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {playTitle}
                </Link>
              )}
            </>
          )}
          <span className="text-gray-400">→</span>
          <span className="text-gray-600">Audition materials</span>
        </div>

        <PageHeader
          title={user ? `${buildUserName(user)} — Audition` : 'Audition materials'}
        />

        <div className="space-y-6 max-w-2xl">
          {(production?.audition_information || phases.length > 0) && (
            <section className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              {production?.audition_information && (
                <div>
                  <h2 className="text-sm font-semibold text-blue-900 mb-1">
                    From the production team
                  </h2>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">
                    {production.audition_information}
                  </p>
                </div>
              )}
              {phases.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-blue-900 mb-1">
                    Production dates
                  </h2>
                  <dl className="space-y-1">
                    {phases.map(pp => (
                      <div key={pp.id} className="flex gap-2 text-sm text-blue-800">
                        <dt className="font-medium min-w-[100px]">{pp.phase.name}</dt>
                        <dd>
                          {pp.start_date && pp.end_date
                            ? `${format(parseISO(pp.start_date), 'MMM d')}–${format(parseISO(pp.end_date), 'MMM d, yyyy')}`
                            : pp.start_date
                              ? `From ${format(parseISO(pp.start_date), 'MMM d, yyyy')}`
                              : pp.end_date
                                ? `Until ${format(parseISO(pp.end_date), 'MMM d, yyyy')}`
                                : '—'}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Contact info
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Name</dt>
                <dd className="text-gray-900">
                  {user ? buildUserName(user) : '—'}
                </dd>
              </div>
              {user?.email && (
                <div>
                  <dt className="text-gray-500">Email</dt>
                  <dd className="text-gray-900">{user.email}</dd>
                </div>
              )}
              {user?.phone_number && (
                <div>
                  <dt className="text-gray-500">Phone</dt>
                  <dd className="text-gray-900">{user.phone_number}</dd>
                </div>
              )}
              {user?.timezone && (
                <div>
                  <dt className="text-gray-500">Timezone</dt>
                  <dd className="text-gray-900">{user.timezone}</dd>
                </div>
              )}
              {(user?.street_address || user?.city || user?.state || user?.zip) && (
                <div className="col-span-2">
                  <dt className="text-gray-500">Address</dt>
                  <dd className="text-gray-900">
                    {[user.street_address, user.city, user.state, user.zip]
                      .filter(Boolean)
                      .join(', ')}
                  </dd>
                </div>
              )}
              {user?.website && (
                <div>
                  <dt className="text-gray-500">Website</dt>
                  <dd className="text-gray-900">
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {user.website}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {(user?.gender || user?.bio) && (
            <section>
              <h2 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Personal info
              </h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {user?.gender && (
                  <div>
                    <dt className="text-gray-500">Gender</dt>
                    <dd className="text-gray-900">{user.gender}</dd>
                  </div>
                )}
                {user?.bio && (
                  <div className="col-span-2">
                    <dt className="text-gray-500">Bio</dt>
                    <dd className="text-gray-900 whitespace-pre-wrap">{user.bio}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Audition materials
              </h2>
              {isOwner && !isEditing && (
                <Button variant="secondary" onClick={startEditing}>
                  Update
                </Button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Video audition link
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    placeholder="https://"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Anything you'd like the production team to know"
                    className={inputClass}
                  />
                </div>
                {saveError && (
                  <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
                )}
                <div className="flex gap-3">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving…' : 'Save'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <dl className="grid grid-cols-1 gap-y-3 text-sm">
                {sub?.video_url ? (
                  <div>
                    <dt className="text-gray-500">Video</dt>
                    <dd className="text-gray-900">
                      <a
                        href={sub.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 break-all"
                      >
                        {sub.video_url}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {sub?.notes ? (
                  <div>
                    <dt className="text-gray-500">Notes</dt>
                    <dd className="text-gray-900 whitespace-pre-wrap">{sub.notes}</dd>
                  </div>
                ) : null}
                {!sub?.video_url && !sub?.notes && (
                  <p className="text-gray-500 italic">No materials submitted yet.</p>
                )}
              </dl>
            )}
          </section>

          {(user?.emergency_contact_name || user?.emergency_contact_number) && (
            <section>
              <h2 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Emergency contact
              </h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {user?.emergency_contact_name && (
                  <div>
                    <dt className="text-gray-500">Name</dt>
                    <dd className="text-gray-900">{user.emergency_contact_name}</dd>
                  </div>
                )}
                {user?.emergency_contact_number && (
                  <div>
                    <dt className="text-gray-500">Phone</dt>
                    <dd className="text-gray-900">{user.emergency_contact_number}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}
        </div>
      </div>
    )
  },
})
