import { useEffect, useState } from 'react'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Button, ConfirmDialog } from '../../components/ui'
import { phaseQueryOptions, updatePhaseFn, deletePhaseFn } from './queries'

interface Props {
  phaseId: number
}

export function PhaseDetailPage({ phaseId }: Props) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data: phase } = useSuspenseQuery(phaseQueryOptions(phaseId))

  const [editingName, setEditingName] = useState(false)
  const [editingPosition, setEditingPosition] = useState(false)
  const [nameInput, setNameInput] = useState(phase.name)
  const [positionInput, setPositionInput] = useState(phase.position != null ? String(phase.position) : '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!editingName) setNameInput(phase.name)
  }, [phase.name, editingName])

  useEffect(() => {
    if (!editingPosition) setPositionInput(phase.position != null ? String(phase.position) : '')
  }, [phase.position, editingPosition])

  const updateMutation = useMutation({
    mutationFn: updatePhaseFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['phases'] })
      setEditingName(false)
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
      name: nameInput,
      position: positionInput ? Number(positionInput) : null,
      ...overrides,
    })
  }

  const inputClass = 'flex-1 border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent text-xl font-semibold'

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          {editingName ? (
            <form className="flex-1 flex items-center gap-2" onSubmit={e => { e.preventDefault(); handleSave() }}>
              <input
                autoFocus
                className={inputClass}
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                required
              />
              <Button type="submit" variant="primary">Save</Button>
              <Button type="button" variant="secondary" onClick={() => setEditingName(false)}>Cancel</Button>
            </form>
          ) : (
            <h1
              className="text-xl font-semibold text-gray-900 cursor-pointer hover:bg-gray-50 rounded px-1 -ml-1"
              onDoubleClick={() => setEditingName(true)}
              title="Double-click to edit"
            >
              {phase.name}
            </h1>
          )}
          {!editingName && (
            <Button variant="danger" className="ml-4 shrink-0" onClick={() => setShowDeleteConfirm(true)}>
              Delete
            </Button>
          )}
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
            onCancel={() => setShowDeleteConfirm(false)}
            confirmLabel="Delete"
            isDestructive
          />
        )}
      </div>
    </div>
  )
}
