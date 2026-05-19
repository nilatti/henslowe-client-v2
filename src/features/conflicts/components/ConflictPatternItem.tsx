import { useState } from 'react'
import { useDeleteConflictPattern } from '../api/conflicts'
import type { ConflictPattern } from '../types/conflict'
import { Button, ConfirmDialog } from '../../../components/ui'

interface ConflictPatternItemProps {
  pattern: ConflictPattern
  canEdit: boolean
  invalidateKey: unknown[]
}

function formatTimeStr(timeStr: string): string {
  try {
    const [h, m] = timeStr.split(':').map(Number)
    const ampm = h >= 12 ? 'pm' : 'am'
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
  } catch {
    return timeStr
  }
}

function parseDays(daysOfWeekStr: string): string[] {
  try {
    return JSON.parse(daysOfWeekStr)
  } catch {
    return []
  }
}

export function ConflictPatternItem({
  pattern,
  canEdit,
  invalidateKey,
}: ConflictPatternItemProps) {
  const deletePattern = useDeleteConflictPattern(invalidateKey)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const days = parseDays(pattern.days_of_week)
  const daysDisplay = days
    .map(d => d.charAt(0).toUpperCase() + d.slice(1) + 's')
    .join(', ')

  return (
    <li className="flex items-center justify-between py-2 text-sm border-b border-gray-100 last:border-0">
      <div className="text-gray-700">
        <span className="font-medium">{daysDisplay || 'No days set'}</span>
        <span className="text-gray-500 ml-2">
          {formatTimeStr(pattern.start_time)} – {formatTimeStr(pattern.end_time)}
        </span>
        {pattern.start_date && (
          <span className="text-gray-400 ml-2 text-xs">
            ({pattern.start_date} to {pattern.end_date})
          </span>
        )}
        {canEdit && pattern.category && (
          <span className="text-gray-500 ml-2">· {pattern.category}</span>
        )}
      </div>
      {canEdit && (
        <div className="ml-4 shrink-0">
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        </div>
      )}
      {confirmDelete && (
        <ConfirmDialog
          message="Delete this conflict pattern? This will also delete all individual conflicts generated from it."
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deletePattern.mutateAsync(pattern.id)
            setConfirmDelete(false)
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </li>
  )
}
