import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { StageExitForm } from './StageExitForm'
import type { StageExit } from '../../types/stageExit'

interface StageExitShowProps {
  stageExit: StageExit
  isAdmin: boolean
  onUpdate: (data: { id: number; name: string }) => void
  onDelete: (id: number) => void
  isUpdating?: boolean
  isDeleting?: boolean
}

export function StageExitShow({
  stageExit,
  isAdmin,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting,
}: StageExitShowProps) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <li className="py-2">
        <StageExitForm
          stageExit={stageExit}
          onSubmit={data => {
            onUpdate({ id: stageExit.id, name: data.name })
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
          isPending={isUpdating}
        />
      </li>
    )
  }

  return (
    <li className="group flex items-center justify-between py-2 px-1 rounded hover:bg-gray-50">
      <span
        className={`text-sm ${isAdmin ? 'cursor-pointer hover:text-blue-600' : ''} ${isDeleting ? 'opacity-50' : ''}`}
        onClick={() => isAdmin && setEditing(true)}
      >
        {stageExit.name}
      </span>
      {isAdmin && (
        <button
          onClick={() => onDelete(stageExit.id)}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity disabled:opacity-50 p-1"
          aria-label="Delete stage exit"
        >
          <Trash2 size={14} />
        </button>
      )}
    </li>
  )
}
