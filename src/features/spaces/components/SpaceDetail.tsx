import { Suspense, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { spaceQueryOptions, spaceRehearsalsQueryOptions, useDeleteSpace } from '../api/spaces'
import { SpaceForm } from './SpaceForm'
import { useIsSuperAdmin, useUserRoleForSpace } from '../../../hooks/useUserRole'
import { useConfirmDelete } from '../../../hooks/useConfirmDelete'
import { ConflictsManager } from '../../conflicts/components/ConflictsManager'
import { upcomingRehearsalsList } from '../../../utils/rehearsalUtils'
import {
  Button,
  Card,
  ConfirmDialog,
  InfoCard,
  LinkedItemList,
  PageHeader,
  Tabs,
} from '../../../components/ui'

function SpaceRehearsalsTab({ spaceId, spaceName }: { spaceId: number; spaceName: string }) {
  const { data: rehearsals } = useSuspenseQuery(spaceRehearsalsQueryOptions(spaceId))

  const playIdByProductionId = new Map(
    rehearsals
      .filter((r) => r.production?.play)
      .map((r) => [r.production.id, r.production.play!.id])
  )

  const rows = upcomingRehearsalsList({
    rehearsals: rehearsals.map((r) => ({
      ...r,
      title: r.title ?? undefined,
      notes: r.notes ?? undefined,
      space: { id: spaceId, name: spaceName },
      users: [],
    })),
    playIdByProductionId,
    dateRangeEnd: null,
  })

  if (rows.length === 0) {
    return (
      <Card>
        <p className="px-4 py-3 text-sm text-gray-500">
          No upcoming rehearsals scheduled at this space.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-400 text-left">
              <th className="p-[10px] font-medium text-gray-700 border-r border-gray-300">Time</th>
              <th className="p-[10px] font-medium text-gray-700 border-r border-gray-300">Location</th>
              <th className="p-[10px] font-medium text-gray-700 border-r border-gray-300">Title</th>
              <th className="p-[10px] font-medium text-gray-700 border-r border-gray-300">Material</th>
              <th className="p-[10px] font-medium text-gray-700">Notes</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    </Card>
  )
}

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
  const { target: confirmDelete, open: requestDelete, close: clearDelete } = useConfirmDelete()

  const tabs = [
    { id: 'info', label: 'Info' },
    { id: 'theaters', label: `Theaters (${space.theaters.length})` },
    { id: 'conflicts', label: `Conflicts (${space.conflicts.length})` },
    { id: 'rehearsals', label: 'Rehearsals' },
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
                  onClick={requestDelete}
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
            <InfoCard
                emptyMessage="No additional information."
                fields={[
                  space.mission_statement && { label: 'Mission', value: space.mission_statement },
                  (space.street_address || space.city) && {
                    label: 'Address',
                    value: [space.street_address, space.city, space.state, space.zip].filter(Boolean).join(', '),
                  },
                  space.phone_number && { label: 'Phone', value: space.phone_number },
                  space.seating_capacity && { label: 'Seating capacity', value: space.seating_capacity },
                  space.website && {
                    label: 'Website',
                    value: <a href={space.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">{space.website}</a>,
                  },
                ]}
              />
          )}

          {activeTab === 'theaters' && (
            <LinkedItemList
              emptyMessage="Not associated with any theaters yet."
              items={space.theaters.map(t => ({
                key: t.id,
                to: '/theaters/$theaterId',
                params: { theaterId: String(t.id) },
                label: t.name,
                meta: t.city ? `${t.city}, ${t.state}` : undefined,
              }))}
            />
          )}

          {activeTab === 'conflicts' && (
            <ConflictsManager
              spaceId={spaceId}
              canEdit={isAdmin}
            />
          )}

          {activeTab === 'rehearsals' && (
            <Suspense fallback={<Card><p className="px-4 py-3 text-sm text-gray-400">Loading rehearsals…</p></Card>}>
              <SpaceRehearsalsTab spaceId={spaceId} spaceName={space.name} />
            </Suspense>
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
          onCancel={clearDelete}
        />
      )}
    </div>
  )
}
