import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useConfirmDelete } from '../../../hooks/useConfirmDelete'
import { Link, useNavigate } from '@tanstack/react-router'
import { userQueryOptions, useDeleteUser, useUpdatePaidOverride } from '../api/users'
import { UserForm } from './UserForm'
import { useAuth } from '../../../hooks/useAuth'
import { useIsSuperAdmin } from '../../../hooks/useUserRole'
import { buildUserName } from '../../../utils/actorUtils'
import { ConflictsManager } from '../../conflicts/components/ConflictsManager'
import { HeadshotUpload } from './HeadshotUpload'
import { AddJobToUserForm } from './AddJobToUserForm'
import {
  Button,
  Card,
  ConfirmDialog,
  PageHeader,
  Tabs,
} from '../../../components/ui'
import { format, parseISO } from 'date-fns'

interface UserDetailProps {
  userId: number
}

export function UserDetail({ userId }: UserDetailProps) {
  const { data: user } = useSuspenseQuery(userQueryOptions(userId))
  const deleteUser = useDeleteUser()
  const updatePaidOverride = useUpdatePaidOverride()
  const { user: currentUser } = useAuth()
  const isSuperAdmin = useIsSuperAdmin()
  const navigate = useNavigate()

  const isSelf = currentUser?.id === userId
  const isAdmin = user.overlap === 'theater admin' || user.overlap === 'production admin'
  const canEdit = isSelf || isSuperAdmin || isAdmin
  const canDelete = isSuperAdmin

  const [activeTab, setActiveTab] = useState('info')
  const [isEditing, setIsEditing] = useState(false)
  const [addingJob, setAddingJob] = useState(false)
  const { target: confirmDelete, open: requestDelete, close: clearDelete } = useConfirmDelete()

  const tabs = [
    { id: 'info', label: 'Info' },
    ...(user.jobs ? [{ id: 'jobs', label: `Jobs (${user.jobs.length})` }] : []),
    ...(user.conflicts ? [{ id: 'conflicts', label: `Conflicts (${user.conflicts.length})` }] : []),
  ]

  const fullName = buildUserName({ ...user, email: user.email ?? '' })

  return (
    <div>
      <PageHeader
        title={fullName}
        action={
          <div className="flex gap-2">
            {canEdit && (
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
            {canDelete && (
              <Button variant="danger" onClick={requestDelete}>
                Delete
              </Button>
            )}
          </div>
        }
      />

      {isEditing ? (
        <Card className="p-6 mb-6">
          <UserForm
            user={{ ...user, id: userId }}
            onSuccess={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        </Card>
      ) : (
        <>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'info' && (
            <Card className="p-6">
              {(canEdit || user.headshot_url) && (
                <div className="flex justify-center mb-6">
                  {canEdit ? (
                    <HeadshotUpload userId={userId} currentUrl={user.headshot_url} />
                  ) : (
                    <img
                      src={user.headshot_url!}
                      alt={`${fullName}'s headshot`}
                      className="w-32 h-32 rounded-full object-cover ring-2 ring-gray-200"
                    />
                  )}
                </div>
              )}
              <dl className="space-y-3 text-sm">
                {user.preferred_name && (
                  <div>
                    <dt className="font-medium text-gray-700">Preferred name</dt>
                    <dd className="text-gray-600 mt-1">{user.preferred_name}</dd>
                  </div>
                )}
                {user.program_name && (
                  <div>
                    <dt className="font-medium text-gray-700">Program name</dt>
                    <dd className="text-gray-600 mt-1">{user.program_name}</dd>
                  </div>
                )}
                {user.email && (
                  <div>
                    <dt className="font-medium text-gray-700">Email</dt>
                    <dd className="mt-1">
                      <a
                        href={`mailto:${user.email}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {user.email}
                      </a>
                    </dd>
                  </div>
                )}
                {user.phone_number && (
                  <div>
                    <dt className="font-medium text-gray-700">Phone</dt>
                    <dd className="text-gray-600 mt-1">{user.phone_number}</dd>
                  </div>
                )}
                {user.website && (
                  <div>
                    <dt className="font-medium text-gray-700">Website</dt>
                    <dd className="mt-1">
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
                {(user.street_address || user.city) && (
                  <div>
                    <dt className="font-medium text-gray-700">Address</dt>
                    <dd className="text-gray-600 mt-1">
                      {[user.street_address, user.city, user.state, user.zip]
                        .filter(Boolean)
                        .join(', ')}
                    </dd>
                  </div>
                )}
                {user.birthdate && (
                  <div>
                    <dt className="font-medium text-gray-700">Date of birth</dt>
                    <dd className="text-gray-600 mt-1">
                      {format(parseISO(user.birthdate), 'MMMM d, yyyy')}
                    </dd>
                  </div>
                )}
                {user.gender && (
                  <div>
                    <dt className="font-medium text-gray-700">Gender</dt>
                    <dd className="text-gray-600 mt-1">{user.gender}</dd>
                  </div>
                )}
                {user.timezone && (
                  <div>
                    <dt className="font-medium text-gray-700">Timezone</dt>
                    <dd className="text-gray-600 mt-1">{user.timezone}</dd>
                  </div>
                )}
                {user.bio && (
                  <div>
                    <dt className="font-medium text-gray-700">Bio</dt>
                    <dd className="text-gray-600 mt-1 leading-relaxed">
                      {user.bio}
                    </dd>
                  </div>
                )}
                {user.description && (
                  <div>
                    <dt className="font-medium text-gray-700">Description</dt>
                    <dd className="text-gray-600 mt-1 leading-relaxed">
                      {user.description}
                    </dd>
                  </div>
                )}
                {user.emergency_contact_name && (
                  <div>
                    <dt className="font-medium text-gray-700">
                      Emergency contact
                    </dt>
                    <dd className="text-gray-600 mt-1">
                      {user.emergency_contact_name}
                      {user.emergency_contact_number &&
                        ` — ${user.emergency_contact_number}`}
                    </dd>
                  </div>
                )}
                {isSuperAdmin && (
                  <div>
                    <dt className="font-medium text-gray-700">Subscription</dt>
                    <dd className="mt-1 flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {user.subscription_status === 'active'
                          ? 'Active subscriber'
                          : user.paid_override
                            ? 'Override (free access)'
                            : 'Not subscribed'}
                      </span>
                      {user.subscription_status !== 'active' && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={user.paid_override === true}
                            onClick={() => updatePaidOverride.mutate({ id: userId, paid_override: !user.paid_override })}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 ${user.paid_override ? 'bg-purple-600' : 'bg-gray-300'}`}
                          >
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${user.paid_override ? 'translate-x-4' : 'translate-x-1'}`} />
                          </button>
                          <span className="text-sm text-gray-600">Grant free access</span>
                        </label>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
          )}

          {activeTab === 'jobs' && user.jobs && (
            <Card>
              {(isSuperAdmin || isAdmin) && (
                <div className="px-4 pt-3">
                  {addingJob ? (
                    <AddJobToUserForm
                      userId={userId}
                      invalidateKey={['users', userId]}
                      targetUserJobs={(user.jobs ?? []).filter(j => j.theater_id != null) as { theater_id: number; production_id?: number | null }[]}
                      targetUserSubscriptionStatus={user.subscription_status}
                      targetUserPaidOverride={user.paid_override}
                      onSuccess={() => setAddingJob(false)}
                      onCancel={() => setAddingJob(false)}
                    />
                  ) : (
                    <Button variant="secondary" onClick={() => setAddingJob(true)}>
                      Add job
                    </Button>
                  )}
                </div>
              )}
              {user.jobs.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500">No jobs yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100 mt-3">
                  {user.jobs.map(job => (
                    <li
                      key={job.id}
                      className="px-4 py-3 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900">
                            {job.specialization?.title ?? 'Unknown role'}
                          </span>
                          {job.character && (
                            <span className="text-gray-500 ml-2">
                              as {job.character.name}
                            </span>
                          )}
                          {job.character_group && (
                            <span className="text-gray-500 ml-2">
                              as {job.character_group.name}
                            </span>
                          )}
                        </div>
                        <div className="text-right text-gray-400 text-xs">
                          {job.production ? (
                            <Link
                              to={'/productions/$productionId' as never}
                              params={{
                                productionId: String(job.production.id),
                              } as never}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {job.production.play?.title}
                            </Link>
                          ) : job.theater ? (
                            <Link
                              to={'/theaters/$theaterId' as never}
                              params={{ theaterId: String(job.theater_id) } as never}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {job.theater.name}
                            </Link>
                          ) : null}
                          {job.start_date && (
                            <div>
                              {format(parseISO(job.start_date), 'MMM yyyy')}
                              {job.end_date &&
                                ` → ${format(parseISO(job.end_date), 'MMM yyyy')}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {activeTab === 'conflicts' && (
            <ConflictsManager
              userId={userId}
              canEdit={canEdit}
            />
          )}
        </>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete ${fullName}? This cannot be undone.`}
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deleteUser.mutateAsync(userId)
            void navigate({ to: '/users' as never })
          }}
          onCancel={clearDelete}
        />
      )}
    </div>
  )
}
