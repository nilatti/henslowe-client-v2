import { useState } from 'react'
import { useUpdateJob } from '../api/jobs'
import type { JobWithDetails } from '../types/job'
import { Button, Card, FormField } from '../../../components/ui'
import { getActorsAndAuditioners } from '../utils/jobUtils'
import { ACTOR_SPECIALIZATION_ID } from '../../../utils/constants'
import { UserCombobox } from './UserCombobox'

interface CastingReassignProps {
  jobs: JobWithDetails[]
  invalidateKey: unknown[]
  onClose: () => void
}

export function CastingReassign({
  jobs,
  invalidateKey,
  onClose,
}: CastingReassignProps) {
  const updateJob = useUpdateJob(invalidateKey)
  const [fromUserId, setFromUserId] = useState(0)
  const [toUserId, setToUserId] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const actorsAndAuditioners = getActorsAndAuditioners(jobs)

  const handleSubmit = async () => {
    if (!fromUserId || !toUserId || fromUserId === toUserId) return
    setIsSubmitting(true)
    const rolesToReassign = jobs.filter(
      j =>
        j.specialization_id === ACTOR_SPECIALIZATION_ID &&
        j.user_id === fromUserId
    )
    for (const job of rolesToReassign) {
      await updateJob.mutateAsync({ id: job.id, user_id: toUserId })
    }
    setIsSubmitting(false)
    onClose()
  }

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        Reassign a whole track
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Transfer all roles from one actor to another in a single operation.
      </p>
      <div className="space-y-3">
        <FormField label="From actor">
          <UserCombobox
            users={actorsAndAuditioners}
            value={fromUserId}
            onChange={setFromUserId}
          />
        </FormField>
        <FormField label="To actor">
          <UserCombobox
            users={actorsAndAuditioners.filter(u => u.id !== fromUserId)}
            value={toUserId}
            onChange={setToUserId}
          />
        </FormField>
      </div>
      <div className="flex gap-2 mt-4">
        <Button
          onClick={handleSubmit}
          disabled={!fromUserId || !toUserId || isSubmitting}
        >
          {isSubmitting ? 'Reassigning...' : 'Reassign all roles'}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Card>
  )
}
