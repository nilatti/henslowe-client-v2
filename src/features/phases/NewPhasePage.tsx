import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Button, PageHeader } from '../../components/ui'
import { createPhaseFn } from './queries'

export function NewPhasePage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [position, setPosition] = useState('')

  const createMutation = useMutation({
    mutationFn: createPhaseFn,
    onSuccess: data => {
      qc.invalidateQueries({ queryKey: ['phases'] })
      void navigate({ to: '/phases/$phaseId', params: { phaseId: String(data.id) } })
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate({ name, position: position ? Number(position) : null })
  }

  const inputClass = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500'

  return (
    <div className="max-w-lg">
      <PageHeader title="New Phase" />
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={inputClass}
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position <span className="text-gray-400 font-normal">(controls sort order)</span>
            </label>
            <input
              type="number"
              className={inputClass}
              value={position}
              onChange={e => setPosition(e.target.value)}
              min={0}
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" variant="primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => void navigate({ to: '/phases' })}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
