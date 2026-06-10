import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useUpdateJob, useDeleteJob } from '../api/jobs'
import type { JobWithDetails } from '../types/job'
import { Button, ConfirmDialog } from '../../../components/ui'
import { buildUserName } from '../../../utils/actorUtils'

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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | ''>(
    casting.user_id ?? ''
  )

  const lineCount =
    casting.character?.new_line_count ?? casting.character?.original_line_count

  const handleCast = () => {
    if (!selectedUserId) return
    const user = actorsAndAuditioners.find(a => a.id === Number(selectedUserId)) ?? null
    setIsEditing(false)
    updateJob.mutate({
      id: casting.id,
      user_id: Number(selectedUserId),
      _user: user,
    })
  }

  const actorName = casting.user ? buildUserName(casting.user) : null

  return (
    <li className="flex items-center justify-between px-4 py-3 text-sm border-b border-gray-100 last:border-0">
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
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            >
              <option value="">Select actor</option>
              {actorsAndAuditioners.map(actor => (
                <option key={actor.id} value={actor.id}>
                  {buildUserName(actor)}
                  {actor.fake ? ' (placeholder)' : ''}
                </option>
              ))}
            </select>
            <Button onClick={handleCast} disabled={!selectedUserId}>
              Cast
            </Button>
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <>
            {actorName ? (
              <Link
                to="/users/$userId"
                params={{ userId: String(casting.user_id) }}
                className={casting.user?.fake ? 'text-amber-600 italic' : 'hover:text-blue-600'}
              >
                {actorName}
              </Link>
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
                  onClick={() => setConfirmDelete(true)}
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
            setConfirmDelete(false)
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </li>
  )
}
