import { useEffect, useState } from 'react'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useNavigate } from '@tanstack/react-router'
import { Button, ConfirmDialog, EditableText } from '../../components/ui'
import { phaseQueryOptions, updatePhaseFn, deletePhaseFn } from './queries'

interface Props {
  phaseId: number
}

export function PhaseDetailPage({ phaseId }: Props) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data: phase } = useSuspenseQuery(phaseQueryOptions(phaseId))

  const [editingPosition, setEditingPosition] = useState(false)
  const [positionInput, setPositionInput] = useState(phase.position != null ? String(phase.position) : '')
  const { target: showDeleteConfirm, open: openDeleteConfirm, close: closeDeleteConfirm } = useConfirmDelete()

  useEffect(() => {
    if (!editingPosition) setPositionInput(phase.position != null ? String(phase.position) : '')
  }, [phase.position, editingPosition])

  const updateMutation = useMutation({
    mutationFn: updatePhaseFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['phases'] })
      setEditingPosition(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePhaseFn,
    onSuccess: () => {
      qc.removeQueries({ queryKey: ['phases', phaseId] })
      qc.invalidateQueries({ queryKey: ['phases'], exact: true })
      void navigate({ to: '/phases' })
    },
  })

  function handleSave(overrides?: Partial<{ name: string; position: number | null }>) {
    updateMutation.mutate({
      id: phaseId,
      name: phase.name,
      position: positionInput ? Number(positionInput) : null,
      ...overrides,
    })
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <EditableText
            value={phase.name}
            onSave={(v) => handleSave({ name: v })}
            as="h1"
            className="text-xl font-semibold text-gray-900"
            required
          />
          <Button variant="danger" className="ml-4 shrink-0" onClick={openDeleteConfirm}>
            Delete
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          {editingPosition ? (
            <form className="flex items-center gap-2" onSubmit={e => { e.preventDefault(); handleSave() }}>
              <label className="font-medium text-gray-700">Position:</label>
              <input
                autoFocus
                type="number"
                className="w-24 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={positionInput}
                onChange={e => setPositionInput(e.target.value)}
                min={0}
              />
              <Button type="submit" variant="primary">Save</Button>
              <Button type="button" variant="secondary" onClick={() => setEditingPosition(false)}>Cancel</Button>
            </form>
          ) : (
            <p
              className="cursor-pointer hover:bg-gray-50 rounded px-1 -ml-1"
              onDoubleClick={() => setEditingPosition(true)}
              title="Double-click to edit"
            >
              <span className="font-medium text-gray-700">Position:</span>{' '}
              {phase.position != null ? phase.position : <span className="text-gray-400 italic">not set</span>}
            </p>
          )}
        </div>

        {showDeleteConfirm && (
          <ConfirmDialog
            message={`Delete phase "${phase.name}"? This will remove it from all specializations and productions.`}
            onConfirm={() => deleteMutation.mutate(phaseId)}
            onCancel={closeDeleteConfirm}
            confirmLabel="Delete"
            isDestructive
          />
        )}
      </div>
    </div>
  )
}
