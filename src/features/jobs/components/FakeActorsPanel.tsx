import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCreateJob, fakeUsersQueryOptions } from '../api/jobs'
import type { FakeActorCount, JobWithDetails } from '../types/job'
import { Button, Card } from '../../../components/ui'
import { AUDITIONER_SPECIALIZATION_ID } from '../../../utils/constants'
import { getFakeActorCount } from '../utils/jobUtils'

interface FakeActorsPanelProps {
  jobs: JobWithDetails[]
  productionId: number
  theaterId: number
  invalidateKey: unknown[]
}

export function FakeActorsPanel({
  jobs,
  productionId,
  theaterId,
  invalidateKey,
}: FakeActorsPanelProps) {
  const createJob = useCreateJob(invalidateKey)
  const { data: allFakeUsers = [] } = useQuery(fakeUsersQueryOptions())
  const currentCount = getFakeActorCount(jobs)
  const fakeActors = jobs
    .filter(j => j.user?.fake)
    .map(j => j.user!)
    .filter((u, i, arr) => arr.findIndex(a => a.id === u.id) === i)

  const [counts, setCounts] = useState<FakeActorCount>({
    female: currentCount.female,
    male: currentCount.male,
    nonbinary: currentCount.nonbinary,
  })

  const handleSubmit = async () => {
    const toAdd: typeof allFakeUsers = []

    const addForGender = (gender: string, current: number, desired: number) => {
      const needed = desired - current
      if (needed <= 0) return
      const pool = allFakeUsers.filter(
        u =>
          (u.gender === gender ||
            (gender === 'nonbinary' &&
              !['cis male', 'cis female', 'trans male', 'trans female'].includes(
                u.gender ?? ''
              ))) &&
          !fakeActors.find(fa => fa.id === u.id) &&
          !toAdd.find(a => a.id === u.id)
      )
      for (let i = 0; i < needed && pool.length > 0; i++) {
        const idx = Math.floor(Math.random() * pool.length)
        toAdd.push(pool.splice(idx, 1)[0])
      }
    }

    addForGender('cis female', currentCount.female, counts.female)
    addForGender('cis male', currentCount.male, counts.male)
    addForGender('nonbinary', currentCount.nonbinary, counts.nonbinary)

    for (const actor of toAdd) {
      await createJob.mutateAsync({
        production_id: productionId,
        theater_id: theaterId,
        specialization_id: AUDITIONER_SPECIALIZATION_ID,
        user_id: actor.id,
      })
    }
  }

  return (
    <Card className="p-4">
      <p className="text-xs text-gray-500 italic mb-3">
        Not ready to cast for real? Generate placeholder actors for doubling analysis.
        You can't reduce the count below the current number.
      </p>
      <div className="space-y-3">
        {(['female', 'male', 'nonbinary'] as const).map(gender => (
          <div key={gender} className="flex items-center gap-3">
            <label className="text-sm text-gray-700 w-32 capitalize">
              {gender === 'nonbinary' ? 'Nonbinary / fluid' : `${gender} actors`}
            </label>
            <input
              type="number"
              min={currentCount[gender]}
              max={999}
              value={counts[gender]}
              onChange={e =>
                setCounts(prev => ({
                  ...prev,
                  [gender]: Math.max(currentCount[gender], Number(e.target.value)),
                }))
              }
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <span className="text-xs text-gray-400">
              (current: {currentCount[gender]})
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <Button
          onClick={handleSubmit}
          disabled={createJob.isPending}
        >
          {createJob.isPending ? 'Adding...' : 'Update fake actors'}
        </Button>
      </div>
      {fakeActors.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-700 mb-2">
            Current placeholders:
          </p>
          <ul className="text-xs text-amber-600 space-y-1">
            {fakeActors.map(a => (
              <li key={a.id}>
                {a.first_name} {a.last_name} ({a.gender ?? 'gender not set'})
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
