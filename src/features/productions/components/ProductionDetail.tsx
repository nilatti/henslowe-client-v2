import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import {
  productionSkeletonQueryOptions,
  useDeleteProduction,
} from '../api/productions'
import { ProductionForm } from './ProductionForm'
import { CastList } from '../../jobs/components/CastList'
import { useIsSuperAdmin } from '../../../hooks/useUserRole'
import {
  Button,
  Card,
  ConfirmDialog,
  PageHeader,
  Tabs,
} from '../../../components/ui'

interface ProductionDetailProps {
  productionId: number
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  try {
    return format(parseISO(d), 'MMM d, yyyy')
  } catch {
    return d
  }
}

export function ProductionDetail({ productionId }: ProductionDetailProps) {
  const { data: production } = useSuspenseQuery(
    productionSkeletonQueryOptions(productionId)
  )
  const deleteProduction = useDeleteProduction()
  const isSuperAdmin = useIsSuperAdmin()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('info')
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const title = production.play.title

  const tabs = [
    { id: 'info', label: 'Info' },
    { id: 'people', label: 'People' },
    { id: 'rehearsals', label: 'Rehearsals' },
  ]

  return (
    <div>
      <div className="mb-2 flex gap-2 text-sm">
        <Link
          to="/productions"
          className="text-blue-600 hover:text-blue-800"
        >
          Productions
        </Link>
        <span className="text-gray-400">→</span>
        <span className="text-gray-600">{title}</span>
      </div>

      <PageHeader
        title={title}
        action={
          isSuperAdmin && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            </div>
          )
        }
      />

      {isEditing ? (
        <Card className="p-6 mb-6">
          <ProductionForm
            production={production}
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
                <div>
                  <dt className="font-medium text-gray-700">Theater</dt>
                  <dd className="text-gray-600 mt-1">{production.theater.name}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Play</dt>
                  <dd className="text-gray-600 mt-1">{production.play.title}</dd>
                </div>
                {(production.start_date || production.end_date) && (
                  <div>
                    <dt className="font-medium text-gray-700">Dates</dt>
                    <dd className="text-gray-600 mt-1">
                      {formatDate(production.start_date)}
                      {production.end_date && ` – ${formatDate(production.end_date)}`}
                    </dd>
                  </div>
                )}
                {production.lines_per_minute != null && (
                  <div>
                    <dt className="font-medium text-gray-700">Lines per minute</dt>
                    <dd className="text-gray-600 mt-1">{production.lines_per_minute}</dd>
                  </div>
                )}
              </dl>
            </Card>
          )}

          {activeTab === 'people' && (
            <CastList
              productionId={productionId}
              theaterId={production.theater.id}
              productionStartDate={production.start_date}
              productionEndDate={production.end_date}
            />
          )}

          {activeTab === 'rehearsals' && (
            <Card className="p-4">
              <p className="text-sm text-gray-400 italic">
                Rehearsal management coming in a future update.
              </p>
            </Card>
          )}
        </>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete production of ${title}? This cannot be undone.`}
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deleteProduction.mutateAsync(productionId)
            navigate({ to: '/productions' })
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
