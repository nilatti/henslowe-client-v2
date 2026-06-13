import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
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
  const [confirmDelete, setConfirmDelete] = useState(false)
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
                <Button variant="danger" onClick={() => setConfirmDelete(true)}>
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
            <Card className="p-6">
              <dl className="space-y-3 text-sm">
                {theater.mission_statement && (
                  <div>
                    <dt className="font-medium text-gray-700">Mission</dt>
                    <dd className="text-gray-600 mt-1">{theater.mission_statement}</dd>
                  </div>
                )}
                {(theater.street_address || theater.city) && (
                  <div>
                    <dt className="font-medium text-gray-700">Address</dt>
                    <dd className="text-gray-600 mt-1">
                      {[theater.street_address, theater.city, theater.state, theater.zip]
                        .filter(Boolean).join(', ')}
                    </dd>
                  </div>
                )}
                {theater.phone_number && (
                  <div>
                    <dt className="font-medium text-gray-700">Phone</dt>
                    <dd className="text-gray-600 mt-1">{theater.phone_number}</dd>
                  </div>
                )}
                {theater.website && (
                  <div>
                    <dt className="font-medium text-gray-700">Website</dt>
                    <dd className="mt-1">
                      <a
                        href={theater.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {theater.website}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
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
              <Card>
                {theater.productions.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-500">No productions yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {theater.productions
                      .slice()
                      .sort((a, b) =>
                        (b.start_date ?? '').localeCompare(a.start_date ?? '')
                      )
                      .map(production => (
                        <li key={production.id}>
                          <Link
                            to={'/productions/$productionId' as never}
                            params={{ productionId: String(production.id) } as never}
                            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-sm"
                          >
                            <span className="text-gray-900">{production.play?.title}</span>
                            <span className="text-gray-400 text-xs">
                              {production.start_date
                                ? format(parseISO(production.start_date), 'MMM yyyy')
                                : '—'}
                              {production.end_date
                                ? ` → ${format(parseISO(production.end_date), 'MMM yyyy')}`
                                : ''}
                            </span>
                          </Link>
                        </li>
                      ))}
                  </ul>
                )}
              </Card>
            </>
          )}

          {activeTab === 'spaces' && (
            <Card>
              {theater.spaces.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500">No spaces yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {theater.spaces.map(space => (
                    <li key={space.id}>
                      <Link
                        to={'/spaces/$spaceId' as never}
                        params={{ spaceId: String(space.id) } as never}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-sm"
                      >
                        <span className="text-gray-900">{space.name}</span>
                        {space.seating_capacity && (
                          <span className="text-gray-400 text-xs">
                            {space.seating_capacity} seats
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
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
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
