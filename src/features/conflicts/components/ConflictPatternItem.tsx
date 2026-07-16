import { format, parseISO } from 'date-fns'
import { useDeleteConflictPattern } from '../api/conflicts'
import { useConfirmDelete } from '../../../hooks/useConfirmDelete'
import type { Conflict, ConflictPattern } from '../types/conflict'
import { Button, ConfirmDialog } from '../../../components/ui'

interface ConflictPatternItemProps {
  pattern: ConflictPattern
  occurrences: Conflict[]
  canEdit: boolean
  invalidateKey: unknown[]
}

function formatTimeStr(timeStr: string): string {
  try {
    // Strip timezone offset suffix if present (e.g. "10:00-04:00" → "10:00")
    const bare = timeStr.replace(/[+-]\d{2}:\d{2}$/, '')
    const [h, m] = bare.split(':').map(Number)
    const ampm = h >= 12 ? 'pm' : 'am'
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
  } catch {
    return timeStr
  }
}

// Recurring conflicts are generated as concrete UTC occurrences (see Conflict);
// the pattern's own start_time/end_time are timezone-less wall-clock strings, so
// we render a real generated occurrence (converted to the viewer's local time)
// instead — same approach ConflictItem uses for one-time conflicts.
function pickDisplayOccurrence(occurrences: Conflict[]): Conflict | null {
  if (occurrences.length === 0) return null
  const sorted = [...occurrences].sort(
    (a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime(),
  )
  const now = Date.now()
  return sorted.find((o) => parseISO(o.start_time).getTime() >= now) ?? sorted[sorted.length - 1]
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
  occurrences,
  canEdit,
  invalidateKey,
}: ConflictPatternItemProps) {
  const deletePattern = useDeleteConflictPattern(invalidateKey)
  const { target: confirmDelete, open: requestDelete, close: clearDelete } = useConfirmDelete()

  const days = parseDays(pattern.days_of_week)
  const daysDisplay = days
    .map(d => d.charAt(0).toUpperCase() + d.slice(1) + 's')
    .join(', ')

  const displayOccurrence = pickDisplayOccurrence(occurrences)
  const timeRangeDisplay = displayOccurrence
    ? `${format(parseISO(displayOccurrence.start_time), 'h:mm a')} – ${format(parseISO(displayOccurrence.end_time), 'h:mm a')}`
    : `${formatTimeStr(pattern.start_time)} – ${formatTimeStr(pattern.end_time)} (as entered — timezone unknown)`

  return (
    <li className="flex items-center justify-between py-2 text-sm border-b border-gray-100 last:border-0">
      <div className="text-gray-700">
        <span className="font-medium">{daysDisplay || 'No days set'}</span>
        <span className="text-gray-500 ml-2">
          {timeRangeDisplay}
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
          <Button variant="danger" onClick={requestDelete}>
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
            clearDelete()
          }}
          onCancel={clearDelete}
        />
      )}
    </li>
  )
}
