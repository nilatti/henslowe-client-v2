import { useState } from 'react'
import { useUpdateJob } from '../api/jobs'
import type { JobWithDetails } from '../types/job'
import { Button, Card } from '../../../components/ui'
import { buildUserName } from '../../../utils/actorUtils'
import { getActorsAndAuditioners } from '../utils/jobUtils'
import { ACTOR_SPECIALIZATION_ID } from '../../../utils/constants'

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
  const [fromUserId, setFromUserId] = useState<number | ''>('')
  const [toUserId, setToUserId] = useState<number | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const actorsAndAuditioners = getActorsAndAuditioners(jobs)

  const userOptions = actorsAndAuditioners.map(u => ({
    id: u.id,
    label: `${buildUserName(u)}${u.fake ? ' (placeholder)' : ''}`,
  }))

  const handleSubmit = async () => {
    if (!fromUserId || !toUserId || fromUserId === toUserId) return
    setIsSubmitting(true)
    const rolesToReassign = jobs.filter(
      j =>
        j.specialization_id === ACTOR_SPECIALIZATION_ID &&
        j.user_id === fromUserId
    )
    for (const job of rolesToReassign) {
      await updateJob.mutateAsync({ id: job.id, user_id: Number(toUserId) })
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From actor
          </label>
          <select
            value={fromUserId}
            onChange={e => setFromUserId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select actor to reassign from</option>
            {userOptions.map(u => (
              <option key={u.id} value={u.id}>{u.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To actor
          </label>
          <select
            value={toUserId}
            onChange={e => setToUserId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select actor to reassign to</option>
            {userOptions
              .filter(u => u.id !== fromUserId)
              .map(u => (
                <option key={u.id} value={u.id}>{u.label}</option>
              ))}
          </select>
        </div>
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
