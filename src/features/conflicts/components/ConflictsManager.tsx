import { useState } from 'react'
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import type { Conflict, ConflictPattern } from '../types/conflict'
import {
  userConflictsQueryOptions,
  userConflictPatternsQueryOptions,
  spaceConflictsQueryOptions,
  spaceConflictPatternsQueryOptions,
} from '../api/conflicts'
import { ConflictItem } from './ConflictItem'
import { ConflictPatternItem } from './ConflictPatternItem'
import { ConflictForm } from './ConflictForm'
import { ConflictPatternForm } from './ConflictPatternForm'
import { Button, Card } from '../../../components/ui'

interface ConflictsManagerProps {
  userId?: number
  spaceId?: number
  canEdit: boolean
}

export function ConflictsManager({ userId, spaceId, canEdit }: ConflictsManagerProps) {
  const conflictKey = userId ? ['conflicts', { userId }] : ['conflicts', { spaceId }]
  const patternKey = userId
    ? ['conflict_patterns', { userId }]
    : ['conflict_patterns', { spaceId }]

  const conflictOpts = (
    userId ? userConflictsQueryOptions(userId!) : spaceConflictsQueryOptions(spaceId!)
  ) as UseQueryOptions<Conflict[]>
  const patternOpts = (
    userId
      ? userConflictPatternsQueryOptions(userId!)
      : spaceConflictPatternsQueryOptions(spaceId!)
  ) as UseQueryOptions<ConflictPattern[]>

  const { data: conflicts = [], isLoading: conflictsLoading } = useQuery(conflictOpts)
  const { data: patterns = [], isLoading: patternsLoading } = useQuery(patternOpts)

  const [showConflictForm, setShowConflictForm] = useState(false)
  const [showPatternForm, setShowPatternForm] = useState(false)

  const individualConflicts = conflicts.filter(c => !c.regular)
  const regularConflicts = conflicts.filter(c => c.regular)

  return (
    <div className="space-y-6">
      {/* Individual conflicts */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Individual Conflicts ({individualConflicts.length})
        </h3>
        {canEdit && !showConflictForm && (
          <Button className="mb-3" onClick={() => setShowConflictForm(true)}>
            Add Conflict
          </Button>
        )}

        {showConflictForm && (
          <Card className="p-4 mb-3">
            <ConflictForm
              userId={userId}
              spaceId={spaceId}
              invalidateKey={conflictKey}
              onSuccess={() => setShowConflictForm(false)}
              onCancel={() => setShowConflictForm(false)}
            />
          </Card>
        )}

        <Card>
          {conflictsLoading ? (
            <p className="px-4 py-3 text-sm text-gray-500">Loading...</p>
          ) : individualConflicts.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">No individual conflicts.</p>
          ) : (
            <ul className="px-4">
              {individualConflicts.map(conflict => (
                <ConflictItem
                  key={conflict.id}
                  conflict={conflict}
                  canEdit={canEdit}
                  invalidateKey={conflictKey}
                />
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Recurring patterns */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Recurring Patterns ({patterns.length})
        </h3>
        {canEdit && !showPatternForm && (
          <Button className="mb-3" onClick={() => setShowPatternForm(true)}>
            Add Pattern
          </Button>
        )}

        {showPatternForm && (
          <Card className="p-4 mb-3">
            <ConflictPatternForm
              userId={userId}
              spaceId={spaceId}
              invalidateKey={patternKey}
              onSuccess={() => setShowPatternForm(false)}
              onCancel={() => setShowPatternForm(false)}
            />
          </Card>
        )}

        <Card>
          {patternsLoading ? (
            <p className="px-4 py-3 text-sm text-gray-500">Loading...</p>
          ) : patterns.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">No recurring patterns.</p>
          ) : (
            <ul className="px-4">
              {patterns.map(pattern => (
                <ConflictPatternItem
                  key={pattern.id}
                  pattern={pattern}
                  canEdit={canEdit}
                  invalidateKey={patternKey}
                />
              ))}
            </ul>
          )}
        </Card>
      </div>

      {regularConflicts.length > 0 && (
        <p className="text-xs text-gray-400 italic">
          {regularConflicts.length} generated conflict
          {regularConflicts.length !== 1 ? 's' : ''} from patterns (not shown
          individually — delete the pattern to remove them).
        </p>
      )}
    </div>
  )
}
