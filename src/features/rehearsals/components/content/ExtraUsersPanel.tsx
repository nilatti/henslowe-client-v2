import { useState } from 'react'
import type { RehearsalUser } from '../../types/rehearsal'
import { Button, Card } from '../../../../components/ui'
import { buildUserName } from '../../../../utils/actorUtils'

interface ExtraUsersPanelProps {
  extraUsers: RehearsalUser[]
  onConfirm: (confirmedUsers: RehearsalUser[]) => void
}

export function ExtraUsersPanel({ extraUsers, onConfirm }: ExtraUsersPanelProps) {
  const [keepIds, setKeepIds] = useState<Set<number>>(
    new Set(extraUsers.map(u => u.id))
  )

  const handleToggle = (userId: number) => {
    setKeepIds(prev => {
      const next = new Set(prev)
      next.has(userId) ? next.delete(userId) : next.add(userId)
      return next
    })
  }

  return (
    <Card className="p-4 border-amber-200 bg-amber-50">
      <h4 className="text-sm font-semibold text-gray-900 mb-2">
        Some actors are no longer in selected content
      </h4>
      <p className="text-xs text-gray-600 mb-3">
        These actors were called but aren't in any currently selected content.
        Should they still be called? (e.g. designers watching a run)
      </p>
      <div className="space-y-2 mb-4">
        {extraUsers.map(user => (
          <label
            key={user.id}
            className="flex items-center gap-2 text-sm text-gray-700"
          >
            <input
              type="checkbox"
              checked={keepIds.has(user.id)}
              onChange={() => handleToggle(user.id)}
              className="rounded border-gray-300"
            />
            {buildUserName(user)}
          </label>
        ))}
      </div>
      <Button onClick={() => onConfirm(extraUsers.filter(u => keepIds.has(u.id)))}>
        Confirm call list
      </Button>
    </Card>
  )
}
