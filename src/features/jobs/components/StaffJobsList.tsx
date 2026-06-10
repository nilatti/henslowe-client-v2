import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useDeleteJob } from '../api/jobs'
import type { JobWithDetails } from '../types/job'
import { JobForm } from './JobForm'
import { Button, Card, ConfirmDialog } from '../../../components/ui'
import { buildUserName } from '../../../utils/actorUtils'

interface StaffJobsListProps {
  jobs: JobWithDetails[]
  productionId?: number
  theaterId?: number
  isAdmin: boolean
  invalidateKey: unknown[]
}

export function StaffJobsList({
  jobs,
  productionId,
  theaterId,
  isAdmin,
  invalidateKey,
}: StaffJobsListProps) {
  const deleteJob = useDeleteJob(invalidateKey)
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  return (
    <div>
      {isAdmin && !showForm && (
        <div className="mb-3">
          <Button onClick={() => setShowForm(true)}>Add Job</Button>
        </div>
      )}

      {showForm && (
        <Card className="p-4 mb-4">
          <JobForm
            productionId={productionId}
            theaterId={theaterId}
            invalidateKey={invalidateKey}
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      <Card>
        {jobs.length === 0 ? (
          <p className="px-4 py-3 text-sm text-gray-500">No jobs yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {jobs.map(job => (
              <li
                key={job.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-medium text-gray-900">
                    {job.specialization?.title ?? 'Unknown role'}
                  </span>
                  {job.user && job.user_id ? (
                    <Link
                      to="/users/$userId"
                      params={{ userId: String(job.user_id) }}
                      className="text-gray-500 ml-2 hover:text-blue-600"
                    >
                      {buildUserName(job.user)}
                    </Link>
                  ) : (
                    <span className="text-gray-500 ml-2">Unfilled</span>
                  )}
                </div>
                {isAdmin && (
                  <Button
                    variant="danger"
                    onClick={() => setConfirmDelete(job.id)}
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {confirmDelete !== null && (
        <ConfirmDialog
          message="Remove this job?"
          isDestructive
          confirmLabel="Remove"
          onConfirm={async () => {
            await deleteJob.mutateAsync(confirmDelete)
            setConfirmDelete(null)
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
