import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { spaceQueryOptions, useDeleteSpace } from '../api/spaces'
import { SpaceForm } from './SpaceForm'
import { useIsSuperAdmin, useUserRoleForSpace } from '../../../hooks/useUserRole'
import {
  Button,
  Card,
  ConfirmDialog,
  PageHeader,
  Tabs,
} from '../../../components/ui'

interface SpaceDetailProps {
  spaceId: number
}

export function SpaceDetail({ spaceId }: SpaceDetailProps) {
  const { data: space } = useSuspenseQuery(spaceQueryOptions(spaceId))
  const deleteSpace = useDeleteSpace()
  const isSuperAdmin = useIsSuperAdmin()
  const navigate = useNavigate()

  const role = useUserRoleForSpace(space.theaters.map(t => t.id))
  const isAdmin = role === 'theater_admin' || isSuperAdmin

  const [activeTab, setActiveTab] = useState('info')
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const tabs = [
    { id: 'info', label: 'Info' },
    { id: 'theaters', label: `Theaters (${space.theaters.length})` },
    { id: 'conflicts', label: `Conflicts (${space.conflicts.length})` },
  ]

  return (
    <div>
      <PageHeader
        title={space.name}
        action={
          isAdmin && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              {isSuperAdmin && (
                <Button
                  variant="danger"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete
                </Button>
              )}
            </div>
          )
        }
      />

      {isEditing ? (
        <Card className="p-6 mb-6">
          <SpaceForm
            space={space}
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
                {space.mission_statement && (
                  <div>
                    <dt className="font-medium text-gray-700">Mission</dt>
                    <dd className="text-gray-600 mt-1">
                      {space.mission_statement}
                    </dd>
                  </div>
                )}
                {(space.street_address || space.city) && (
                  <div>
                    <dt className="font-medium text-gray-700">Address</dt>
                    <dd className="text-gray-600 mt-1">
                      {[space.street_address, space.city, space.state, space.zip]
                        .filter(Boolean)
                        .join(', ')}
                    </dd>
                  </div>
                )}
                {space.phone_number && (
                  <div>
                    <dt className="font-medium text-gray-700">Phone</dt>
                    <dd className="text-gray-600 mt-1">{space.phone_number}</dd>
                  </div>
                )}
                {space.seating_capacity && (
                  <div>
                    <dt className="font-medium text-gray-700">
                      Seating capacity
                    </dt>
                    <dd className="text-gray-600 mt-1">
                      {space.seating_capacity}
                    </dd>
                  </div>
                )}
                {space.website && (
                  <div>
                    <dt className="font-medium text-gray-700">Website</dt>
                    <dd className="mt-1">
                      <a
                        href={space.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {space.website}
                      </a>
                    </dd>
                  </div>
                )}
                {!space.mission_statement &&
                  !space.street_address &&
                  !space.phone_number &&
                  !space.seating_capacity &&
                  !space.website && (
                    <p className="text-gray-400 italic">
                      No additional information.
                    </p>
                  )}
              </dl>
            </Card>
          )}

          {activeTab === 'theaters' && (
            <Card>
              {space.theaters.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500">
                  Not associated with any theaters yet.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {space.theaters.map(theater => (
                    <li key={theater.id}>
                      <Link
                        to={'/theaters/$theaterId' as never}
                        params={{ theaterId: String(theater.id) } as never}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-sm"
                      >
                        <span className="text-gray-900">{theater.name}</span>
                        {theater.city && (
                          <span className="text-gray-400 text-xs">
                            {theater.city}, {theater.state}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {activeTab === 'conflicts' && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    {space.conflicts.length} conflict
                    {space.conflicts.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    {space.conflict_patterns.length} recurring pattern
                    {space.conflict_patterns.length !== 1 ? 's' : ''}
                  </span>
                </div>
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
          message={`Delete "${space.name}"? This cannot be undone.`}
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deleteSpace.mutateAsync(space.id)
            void navigate({ to: '/spaces' as never })
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
