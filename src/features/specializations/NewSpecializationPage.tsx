import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Button, PageHeader } from '../../components/ui'
import { createSpecializationFn } from './queries'

export function NewSpecializationPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const createMutation = useMutation({
    mutationFn: createSpecializationFn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['specializations'] })
      void navigate({
        to: '/specializations/$specializationId',
        params: { specializationId: String(data.id) },
      })
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate({ title, description: description || null })
  }

  return (
    <div className="max-w-lg">
      <PageHeader title="New Specialization" />
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={6}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" variant="primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void navigate({ to: '/specializations' })}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
