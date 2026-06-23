import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useUpdateJob, useDeleteJob } from '../api/jobs'
import { useConfirmDelete } from '../../../hooks/useConfirmDelete'
import type { JobWithDetails } from '../types/job'
import { Button, ConfirmDialog } from '../../../components/ui'
import { buildUserName, fakeActorGenderLabel } from '../../../utils/actorUtils'
import { UserCombobox } from './UserCombobox'

interface CastingRowProps {
  casting: JobWithDetails
  actorsAndAuditioners: NonNullable<JobWithDetails['user']>[]
  isAdmin: boolean
  invalidateKey: unknown[]
}

export function CastingRow({
  casting,
  actorsAndAuditioners,
  isAdmin,
  invalidateKey,
}: CastingRowProps) {
  const updateJob = useUpdateJob(invalidateKey)
  const deleteJob = useDeleteJob(invalidateKey)
  const [isEditing, setIsEditing] = useState(false)
  const { target: confirmDelete, open: requestDelete, close: clearDelete } = useConfirmDelete()

  const lineCount =
    casting.character?.new_line_count ?? casting.character?.original_line_count

  const handleCast = (userId: number) => {
    const user = actorsAndAuditioners.find(a => a.id === userId) ?? null
    setIsEditing(false)
    updateJob.mutate({ id: casting.id, user_id: userId || null, _user: user })
  }

  const actorName = casting.user ? buildUserName(casting.user) : null

  return (
    <li className="flex items-center justify-between px-4 py-3 text-sm border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        {casting.character_id && casting.production?.play?.id ? (
          <Link
            to="/plays/$playId/characters/$characterId"
            params={{
              playId: String(casting.production.play.id),
              characterId: String(casting.character_id),
            }}
            className="font-medium text-gray-900 hover:text-blue-600 truncate"
          >
            {casting.character?.name ?? 'Unknown character'}
          </Link>
        ) : (
          <span className="font-medium text-gray-900 truncate">
            {casting.character?.name ?? 'Unknown character'}
          </span>
        )}
        {lineCount != null && lineCount > 0 && (
          <span className="text-xs text-gray-400 shrink-0">
            ({lineCount} lines)
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 ml-4 shrink-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <div className="w-48">
              <UserCombobox
                users={actorsAndAuditioners}
                value={casting.user_id ?? 0}
                onChange={handleCast}
                disabled={updateJob.isPending}
              />
            </div>
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <>
            {actorName ? (
              casting.user?.fake ? (
                <span className="text-amber-600 italic">
                  {actorName}{fakeActorGenderLabel(casting.user!) ? ` ${fakeActorGenderLabel(casting.user!)}` : ''}
                </span>
              ) : (
                <Link
                  to="/users/$userId"
                  params={{ userId: String(casting.user_id) }}
                  className="hover:text-blue-600"
                >
                  {actorName}
                </Link>
              )
            ) : isAdmin ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-600 font-semibold hover:text-blue-800"
              >
                Click to cast
              </button>
            ) : null}
            {isAdmin && (
              <div className="flex items-center gap-1">
                <Button variant="secondary" onClick={() => setIsEditing(true)}>
                  Change
                </Button>
                <Button
                  variant="danger"
                  onClick={requestDelete}
                >
                  ×
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          message={`Remove ${casting.character?.name ?? 'this character'} from the cast?`}
          isDestructive
          confirmLabel="Remove"
          onConfirm={async () => {
            await deleteJob.mutateAsync(casting.id)
            clearDelete()
          }}
          onCancel={clearDelete}
        />
      )}
    </li>
  )
}
