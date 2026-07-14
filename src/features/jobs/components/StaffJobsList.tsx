import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useConfirmDelete } from '../../../hooks/useConfirmDelete'
import { useDeleteJob } from '../api/jobs'
import type { JobWithDetails } from '../types/job'
import { JobForm } from './JobForm'
import { InviteForm } from './InviteForm'
import { PendingInvitationsList } from '../../invitations/components/PendingInvitationsList'
import { Button, Card, ConfirmDialog } from '../../../components/ui'
import { buildUserName } from '../../../utils/actorUtils'
import { groupJobsByDepartment } from '../utils/jobUtils'
import _ from 'lodash'

interface StaffJobsListProps {
  jobs: JobWithDetails[]
  productionId?: number
  theaterId?: number
  isAdmin: boolean
  isDreamTheater?: boolean
  invalidateKey: unknown[]
}

export function StaffJobsList({
  jobs,
  productionId,
  theaterId,
  isAdmin,
  isDreamTheater = false,
  invalidateKey,
}: StaffJobsListProps) {
  const deleteJob = useDeleteJob(invalidateKey)
  const [showForm, setShowForm] = useState<'add' | 'invite' | null>(null)
  const { target: confirmDelete, open: requestDelete, close: clearDelete } = useConfirmDelete<number>()

  return (
    <div>
      {isAdmin && !isDreamTheater && (
        <PendingInvitationsList productionId={productionId} theaterId={theaterId} />
      )}

      {isAdmin && !isDreamTheater && !showForm && (
        <div className="mb-3 flex gap-2">
          <Button type="button" onClick={() => setShowForm('add')}>
            Add Job
          </Button>
          <Button type="button" variant="secondary" onClick={() => setShowForm('invite')}>
            Invite someone
          </Button>
        </div>
      )}

      {isDreamTheater && isAdmin && (
        <p className="mb-3 text-sm text-gray-500">
          Dream theater productions can only use placeholder actors.
        </p>
      )}

      {showForm === 'add' && (
        <Card className="p-4 mb-4">
          <JobForm
            productionId={productionId}
            theaterId={theaterId}
            isDreamTheater={isDreamTheater}
            invalidateKey={invalidateKey}
            onSuccess={() => setShowForm(null)}
            onCancel={() => setShowForm(null)}
          />
        </Card>
      )}

      {showForm === 'invite' && (
        <Card className="p-4 mb-4">
          <InviteForm
            productionId={productionId}
            theaterId={theaterId}
            invalidateKey={['invitations', { theaterId, productionId }]}
            onSuccess={() => setShowForm(null)}
            onCancel={() => setShowForm(null)}
          />
        </Card>
      )}

      <Card>
        {jobs.length === 0 ? (
          <p className="px-4 py-3 text-sm text-gray-500">No jobs yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {groupJobsByDepartment(jobs, js => _.sortBy(js, j => j.user?.last_name)).map(deptGroup => (
              <div key={deptGroup.departmentName} className="px-4 py-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {deptGroup.departmentName}
                </h3>
                {deptGroup.specializations.map(specGroup => (
                  <div key={specGroup.title} className="mb-3 last:mb-0">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      {specGroup.title}
                    </h4>
                    <ul className="divide-y divide-gray-50">
                      {specGroup.jobs.map(job => (
                        <li
                          key={job.id}
                          className="flex items-center justify-between py-2 text-sm"
                        >
                          <div>
                            {job.user && job.user_id ? (
                              <Link
                                to="/users/$userId"
                                params={{ userId: String(job.user_id) }}
                                className="text-gray-700 hover:text-blue-600"
                              >
                                {buildUserName(job.user)}
                              </Link>
                            ) : (
                              <span className="text-gray-500">Unfilled</span>
                            )}
                          </div>
                          {isAdmin && (
                            <Button
                              variant="danger"
                              onClick={() => requestDelete(job.id)}
                            >
                              Remove
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Card>

      {confirmDelete !== null && (
        <ConfirmDialog
          message="Remove this job?"
          isDestructive
          confirmLabel="Remove"
          onConfirm={async () => {
            await deleteJob.mutateAsync(confirmDelete)
            clearDelete()
          }}
          onCancel={clearDelete}
        />
      )}
    </div>
  )
}
