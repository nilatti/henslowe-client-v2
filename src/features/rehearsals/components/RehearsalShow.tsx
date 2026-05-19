import { useState } from 'react'
import { formatInTimeZone } from 'date-fns-tz'
import { parseISO } from 'date-fns'
import { useDeleteRehearsal } from '../api/rehearsals'
import type { RehearsalWithDetails, RehearsalUser } from '../types/rehearsal'
import { RehearsalForm } from './RehearsalForm'
import { RehearsalContentManager } from './content/RehearsalContentManager'
import { RehearsalPeopleManager } from './people/RehearsalPeopleManager'
import { Button, ConfirmDialog } from '../../../components/ui'
import { buildUserName } from '../../../utils/actorUtils'
import { rehearsalContent } from '../../../utils/rehearsalUtils'
import { DEFAULT_TIMEZONE } from '../../../utils/constants'

interface RehearsalShowProps {
  rehearsal: RehearsalWithDetails
  productionId: number
  playId: number
  actors: RehearsalUser[]
  staffUsers: RehearsalUser[]
  allUsers: RehearsalUser[]
  isAdmin: boolean
}

export function RehearsalShow({
  rehearsal,
  productionId,
  playId,
  actors,
  staffUsers,
  allUsers,
  isAdmin,
}: RehearsalShowProps) {
  const deleteRehearsal = useDeleteRehearsal(productionId)
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showContentManager, setShowContentManager] = useState(false)
  const [showPeopleManager, setShowPeopleManager] = useState(false)

  const startTime = formatInTimeZone(parseISO(rehearsal.start_time), DEFAULT_TIMEZONE, 'h:mm a')
  const endTime = formatInTimeZone(parseISO(rehearsal.end_time), DEFAULT_TIMEZONE, 'h:mm a')

  const content = rehearsalContent({
    acts: rehearsal.acts as never,
    frenchScenes: rehearsal.french_scenes as never,
    scenes: rehearsal.scenes as never,
  })

  if (isEditing) {
    return (
      <div className="py-3">
        <RehearsalForm
          productionId={productionId}
          rehearsal={rehearsal}
          onSuccess={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className="py-3 border-t border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm font-medium text-gray-900">
              {startTime} – {endTime}
            </span>
            {rehearsal.title && (
              <span className="text-sm text-gray-600">{rehearsal.title}</span>
            )}
          </div>

          {rehearsal.notes && (
            <p className="text-xs text-gray-500 mb-2">{rehearsal.notes}</p>
          )}

          {content.length > 0 && (
            <div className="text-xs text-gray-600 mb-2">
              <span className="font-medium">Content: </span>
              {content.join(', ')}
            </div>
          )}

          {rehearsal.users.length > 0 && (
            <div className="text-xs text-gray-600">
              <span className="font-medium">Called: </span>
              {rehearsal.users.map(u => buildUserName(u)).join(', ')}
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="flex gap-2 ml-4 shrink-0">
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="mt-3 flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setShowContentManager(!showContentManager)
              setShowPeopleManager(false)
            }}
          >
            {showContentManager ? 'Hide content' : 'Edit content'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setShowPeopleManager(!showPeopleManager)
              setShowContentManager(false)
            }}
          >
            {showPeopleManager ? 'Hide call list' : 'Edit call list'}
          </Button>
        </div>
      )}

      {showContentManager && (
        <div className="mt-3">
          <RehearsalContentManager
            rehearsal={rehearsal}
            productionId={productionId}
            playId={playId}
            actors={actors}
            staffUsers={staffUsers}
            onClose={() => setShowContentManager(false)}
          />
        </div>
      )}

      {showPeopleManager && (
        <div className="mt-3">
          <RehearsalPeopleManager
            rehearsal={rehearsal}
            productionId={productionId}
            allUsers={allUsers}
            isAdmin={isAdmin}
          />
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message="Delete this rehearsal?"
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deleteRehearsal.mutateAsync(rehearsal.id)
            setConfirmDelete(false)
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
