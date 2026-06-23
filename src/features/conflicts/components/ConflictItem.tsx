import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useDeleteConflict } from '../api/conflicts'
import { useConfirmDelete } from '../../../hooks/useConfirmDelete'
import type { Conflict } from '../types/conflict'
import { ConflictForm } from './ConflictForm'
import { Button, ConfirmDialog } from '../../../components/ui'

interface ConflictItemProps {
  conflict: Conflict
  canEdit: boolean
  invalidateKey: unknown[]
}

export function ConflictItem({ conflict, canEdit, invalidateKey }: ConflictItemProps) {
  const deleteConflict = useDeleteConflict(invalidateKey)
  const [isEditing, setIsEditing] = useState(false)
  const { target: confirmDelete, open: requestDelete, close: clearDelete } = useConfirmDelete()

  if (isEditing) {
    return (
      <li className="py-3">
        <ConflictForm
          conflict={conflict}
          userId={conflict.user_id ?? undefined}
          spaceId={conflict.space_id ?? undefined}
          invalidateKey={invalidateKey}
          onSuccess={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between py-2 text-sm border-b border-gray-100 last:border-0">
      <div className="text-gray-700">
        <span>
          {format(parseISO(conflict.start_time), 'MM/dd/yyyy h:mm a')}
          {' – '}
          {format(parseISO(conflict.end_time), 'MM/dd/yyyy h:mm a')}
        </span>
        {canEdit && conflict.category && (
          <span className="text-gray-500 ml-2">· {conflict.category}</span>
        )}
      </div>
      {canEdit && (
        <div className="flex gap-2 ml-4 shrink-0">
          <Button variant="secondary" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
          <Button variant="danger" onClick={requestDelete}>
            Delete
          </Button>
        </div>
      )}
      {confirmDelete && (
        <ConfirmDialog
          message="Delete this conflict?"
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deleteConflict.mutateAsync(conflict.id)
            clearDelete()
          }}
          onCancel={clearDelete}
        />
      )}
    </li>
  )
}
