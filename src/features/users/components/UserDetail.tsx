import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { userQueryOptions, useDeleteUser } from '../api/users'
import { UserForm } from './UserForm'
import { useAuth } from '../../../hooks/useAuth'
import { useIsSuperAdmin } from '../../../hooks/useUserRole'
import { buildUserName } from '../../../utils/actorUtils'
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
  const { user: currentUser } = useAuth()
  const isSuperAdmin = useIsSuperAdmin()
  const navigate = useNavigate()

  const isSelf = currentUser?.id === userId
  const canEdit = isSelf || isSuperAdmin
  const canDelete = isSuperAdmin

  const [activeTab, setActiveTab] = useState('info')
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

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
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
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
              </dl>
            </Card>
          )}

          {activeTab === 'jobs' && user.jobs && (
            <Card>
              {user.jobs.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500">No jobs yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
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

          {activeTab === 'conflicts' && user.conflicts && (
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  {user.conflicts.length} conflict
                  {user.conflicts.length !== 1 ? 's' : ''}
                </p>
                {user.conflict_patterns && (
                  <p className="text-sm text-gray-700">
                    {user.conflict_patterns.length} recurring pattern
                    {user.conflict_patterns.length !== 1 ? 's' : ''}
                  </p>
                )}
                <p className="text-xs text-gray-400 italic">
                  Full conflict management coming soon.
                </p>
              </div>
            </Card>
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
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
