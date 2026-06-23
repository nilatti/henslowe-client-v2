import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useConfirmDelete } from '../../../hooks/useConfirmDelete'
import { useNavigate } from '@tanstack/react-router'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { theaterSkeletonQueryOptions, useDeleteTheater } from '../api/theaters'
import { TheaterForm } from './TheaterForm'
import { StaffJobsList } from '../../jobs/components/StaffJobsList'
import { ProductionForm } from '../../productions/components/ProductionForm'
import { useUserRoleForTheater, useIsSuperAdmin } from '../../../hooks/useUserRole'
import {
  Button,
  Card,
  ConfirmDialog,
  InfoCard,
  LinkedItemList,
  PageHeader,
  Tabs,
} from '../../../components/ui'
import { format, parseISO } from 'date-fns'

interface TheaterDetailProps {
  theaterId: number
}

export function TheaterDetail({ theaterId }: TheaterDetailProps) {
  const navigate = useNavigate()
  const { data: theater } = useSuspenseQuery(theaterSkeletonQueryOptions(theaterId))
  usePageTitle(theater.name)
  const deleteTheater = useDeleteTheater()
  const role = useUserRoleForTheater(theaterId)
  const isSuperAdmin = useIsSuperAdmin()
  const isAdmin = role === 'admin' || isSuperAdmin

  const [activeTab, setActiveTab] = useState('info')
  const [isEditing, setIsEditing] = useState(false)
  const { target: confirmDelete, open: requestDelete, close: clearDelete } = useConfirmDelete()
  const [showProductionForm, setShowProductionForm] = useState(false)

  const tabs = [
    { id: 'info', label: 'Info' },
    { id: 'productions', label: `Productions (${theater.productions.length})` },
    { id: 'spaces', label: `Spaces (${theater.spaces.length})` },
    { id: 'people', label: `People (${theater.jobs.length})` },
  ]

  return (
    <div>
      <PageHeader
        title={theater.name}
        action={
          isAdmin ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              {isSuperAdmin && (
                <Button variant="danger" onClick={requestDelete}>
                  Delete
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      {isEditing ? (
        <Card className="p-6 mb-6">
          <TheaterForm
            theater={theater}
            onSuccess={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        </Card>
      ) : (
        <>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'info' && (
            <InfoCard fields={[
                theater.mission_statement && { label: 'Mission', value: theater.mission_statement },
                (theater.street_address || theater.city) && {
                  label: 'Address',
                  value: [theater.street_address, theater.city, theater.state, theater.zip].filter(Boolean).join(', '),
                },
                theater.phone_number && { label: 'Phone', value: theater.phone_number },
                theater.website && {
                  label: 'Website',
                  value: <a href={theater.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">{theater.website}</a>,
                },
              ]} />
          )}

          {activeTab === 'productions' && (
            <>
              {isAdmin && !showProductionForm && (
                <Button className="mb-3" onClick={() => setShowProductionForm(true)}>New Production</Button>
              )}
              {showProductionForm && (
                <Card className="p-6 mb-4">
                  <ProductionForm
                    defaultTheaterId={theaterId}
                    onSuccess={id => {
                      setShowProductionForm(false)
                      if (id) navigate({ to: '/productions/$productionId' as never, params: { productionId: String(id) } as never })
                    }}
                    onCancel={() => setShowProductionForm(false)}
                  />
                </Card>
              )}
              <LinkedItemList
                emptyMessage="No productions yet."
                items={theater.productions
                  .slice()
                  .sort((a, b) => (b.start_date ?? '').localeCompare(a.start_date ?? ''))
                  .map(p => ({
                    key: p.id,
                    to: '/productions/$productionId',
                    params: { productionId: String(p.id) },
                    label: p.play?.title,
                    meta: p.start_date
                      ? `${format(parseISO(p.start_date), 'MMM yyyy')}${p.end_date ? ` → ${format(parseISO(p.end_date), 'MMM yyyy')}` : ''}`
                      : '—',
                  }))
                }
              />
            </>
          )}

          {activeTab === 'spaces' && (
            <LinkedItemList
              emptyMessage="No spaces yet."
              items={theater.spaces.map(s => ({
                key: s.id,
                to: '/spaces/$spaceId',
                params: { spaceId: String(s.id) },
                label: s.name,
                meta: s.seating_capacity ? `${s.seating_capacity} seats` : undefined,
              }))}
            />
          )}

          {activeTab === 'people' && (
            <StaffJobsList
              jobs={theater.jobs as unknown as import('../../jobs/types/job').JobWithDetails[]}
              theaterId={theaterId}
              isAdmin={isAdmin}
              invalidateKey={['theaters', theaterId, 'skeleton']}
            />
          )}
        </>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete ${theater.name}? This will delete all associated productions and jobs.`}
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deleteTheater.mutateAsync(theater.id)
            void navigate({ to: '/theaters' as never })
          }}
          onCancel={clearDelete}
        />
      )}
    </div>
  )
}
