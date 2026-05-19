import { useState } from 'react'
import { useUpdateRehearsal } from '../../api/rehearsals'
import type { RehearsalWithDetails, RehearsalUser } from '../../types/rehearsal'
import { Button, Card } from '../../../../components/ui'
import { buildUserName } from '../../../../utils/actorUtils'

interface RehearsalPeopleManagerProps {
  rehearsal: RehearsalWithDetails
  productionId: number
  allUsers: RehearsalUser[]
  isAdmin: boolean
}

export function RehearsalPeopleManager({
  rehearsal,
  productionId,
  allUsers,
  isAdmin,
}: RehearsalPeopleManagerProps) {
  const update = useUpdateRehearsal(productionId)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>(
    rehearsal.users.map(u => u.id)
  )

  const handleToggle = (userId: number) => {
    setSelectedIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const handleSave = async () => {
    await update.mutateAsync({
      id: rehearsal.id,
      user_ids: selectedIds,
    } as any)
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700">
            Called ({rehearsal.users.length})
          </span>
          {isAdmin && (
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              Edit call list
            </Button>
          )}
        </div>
        {rehearsal.users.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No one called yet.</p>
        ) : (
          <ul className="text-xs text-gray-600 space-y-1">
            {rehearsal.users.map(u => (
              <li key={u.id}>{buildUserName(u)}</li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <Card className="p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Edit call list</h4>
      <div className="space-y-1 max-h-60 overflow-y-auto mb-4">
        {[...allUsers]
          .sort((a, b) => a.last_name.localeCompare(b.last_name))
          .map(u => (
            <label
              key={u.id}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(u.id)}
                onChange={() => handleToggle(u.id)}
                className="rounded border-gray-300"
              />
              {buildUserName(u)}
              {u.fake && (
                <span className="text-xs text-amber-500">(placeholder)</span>
              )}
            </label>
          ))}
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? 'Saving...' : 'Save'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setSelectedIds(rehearsal.users.map(u => u.id))
            setIsEditing(false)
          }}
        >
          Cancel
        </Button>
      </div>
    </Card>
  )
}
