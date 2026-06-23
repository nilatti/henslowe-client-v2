import { useCreateJob, useDeleteJob } from '../api/jobs'
import { useConfirmDelete } from '../../../hooks/useConfirmDelete'
import type { JobWithDetails } from '../types/job'
import type { PlayCharacterGroup } from '../../plays/types/play'
import { Card, ConfirmDialog } from '../../../components/ui'
import { buildUserName } from '../../../utils/actorUtils'
import { ACTOR_SPECIALIZATION_ID } from '../../../utils/constants'
import { UserCombobox } from './UserCombobox'

interface CharacterGroupCastingSectionProps {
  characterGroups: PlayCharacterGroup[]
  jobs: JobWithDetails[]
  auditioners: NonNullable<JobWithDetails['user']>[]
  isAdmin: boolean
  invalidateKey: unknown[]
  productionId: number
  productionStartDate: string | null
  productionEndDate: string | null
}

interface GroupRowProps {
  group: PlayCharacterGroup
  groupJobs: JobWithDetails[]
  auditioners: NonNullable<JobWithDetails['user']>[]
  isAdmin: boolean
  invalidateKey: unknown[]
  productionId: number
  productionStartDate: string | null
  productionEndDate: string | null
}

function CharacterGroupRow({
  group,
  groupJobs,
  auditioners,
  isAdmin,
  invalidateKey,
  productionId,
  productionStartDate,
  productionEndDate,
}: GroupRowProps) {
  const createJob = useCreateJob(invalidateKey)
  const deleteJob = useDeleteJob(invalidateKey)
  const { target: confirmDeleteId, open: requestDelete, close: clearDelete } = useConfirmDelete<number>()

  const assignedUserIds = new Set(groupJobs.map(j => j.user_id).filter(id => id != null))
  const availableAuditioners = auditioners.filter(a => !assignedUserIds.has(a.id))

  const handleAdd = async (userId: number) => {
    if (!userId) return
    await createJob.mutateAsync({
      character_group_id: group.id,
      user_id: userId,
      production_id: productionId,
      specialization_id: ACTOR_SPECIALIZATION_ID,
      start_date: productionStartDate ?? undefined,
      end_date: productionEndDate ?? undefined,
    })
  }

  return (
    <li className="px-4 py-3 text-sm border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <span className="font-medium text-gray-900 pt-0.5">{group.name}</span>
        <div className="flex flex-col items-end gap-1.5">
          {groupJobs.length === 0 && (
            <span className="text-gray-400 text-xs">No actors cast</span>
          )}
          {groupJobs.map(job => (
            <div key={job.id} className="flex items-center gap-2">
              {job.user ? (
                <span className={job.user.fake ? 'text-amber-600 italic' : ''}>
                  {buildUserName(job.user)}
                </span>
              ) : (
                <span className="text-gray-400">Unassigned</span>
              )}
              {isAdmin && (
                <button
                  onClick={() => requestDelete(job.id)}
                  className="text-red-400 hover:text-red-600 leading-none"
                  title="Remove from group"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {isAdmin && availableAuditioners.length > 0 && (
            <div className="mt-0.5 w-52">
              <UserCombobox
                users={availableAuditioners}
                value={0}
                onChange={handleAdd}
                disabled={createJob.isPending}
              />
            </div>
          )}
          {isAdmin && availableAuditioners.length === 0 && groupJobs.length === 0 && (
            <span className="text-xs text-gray-400">Add auditioners below to cast</span>
          )}
        </div>
      </div>

      {confirmDeleteId !== null && (
        <ConfirmDialog
          message={`Remove this actor from ${group.name}?`}
          isDestructive
          confirmLabel="Remove"
          onConfirm={async () => {
            await deleteJob.mutateAsync(confirmDeleteId)
            clearDelete()
          }}
          onCancel={clearDelete}
        />
      )}
    </li>
  )
}

export function CharacterGroupCastingSection({
  characterGroups,
  jobs,
  auditioners,
  isAdmin,
  invalidateKey,
  productionId,
  productionStartDate,
  productionEndDate,
}: CharacterGroupCastingSectionProps) {
  if (characterGroups.length === 0) return null

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-600 mb-2">
        Character Groups ({characterGroups.length})
      </h3>
      <Card>
        <ul>
          {characterGroups.map(group => (
            <CharacterGroupRow
              key={group.id}
              group={group}
              groupJobs={jobs.filter(j => j.character_group_id === group.id)}
              auditioners={auditioners}
              isAdmin={isAdmin}
              invalidateKey={invalidateKey}
              productionId={productionId}
              productionStartDate={productionStartDate}
              productionEndDate={productionEndDate}
            />
          ))}
        </ul>
      </Card>
    </div>
  )
}
