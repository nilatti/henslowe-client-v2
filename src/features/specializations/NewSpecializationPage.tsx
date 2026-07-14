import { useState } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Button, PageHeader } from '../../components/ui'
import { createSpecializationFn } from './queries'
import { departmentsQueryOptions } from '../departments/queries'
import type { SpecializationContext } from './types'

export function NewSpecializationPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: departments } = useSuspenseQuery(departmentsQueryOptions())
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [context, setContext] = useState<SpecializationContext>('both')
  const [productionAdmin, setProductionAdmin] = useState(false)
  const [theaterAdmin, setTheaterAdmin] = useState(false)
  const [departmentId, setDepartmentId] = useState<number | null>(null)

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
    createMutation.mutate({ title, description: description || null, context, production_admin: productionAdmin, theater_admin: theaterAdmin, department_id: departmentId })
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Context</label>
            <select
              className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={context}
              onChange={e => setContext(e.target.value as SpecializationContext)}
            >
              <option value="theater">Theater only</option>
              <option value="production">Production only</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={departmentId ?? ''}
              onChange={e => setDepartmentId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">No department</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={productionAdmin}
                onChange={e => setProductionAdmin(e.target.checked)}
                className="rounded border-gray-300"
              />
              Production admin
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={theaterAdmin}
                onChange={e => setTheaterAdmin(e.target.checked)}
                className="rounded border-gray-300"
              />
              Theater admin
            </label>
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
