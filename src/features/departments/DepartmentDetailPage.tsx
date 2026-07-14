import { useState } from 'react'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useNavigate } from '@tanstack/react-router'
import { useIsSuperAdmin } from '../../hooks/useUserRole'
import { departmentQueryOptions, updateDepartmentFn, deleteDepartmentFn } from './queries'
import { specializationsQueryOptions, updateSpecializationDepartmentFn } from '../specializations/queries'
import { Button, ConfirmDialog, EditableText } from '../../components/ui'

interface Props {
  departmentId: number
}

export function DepartmentDetailPage({ departmentId }: Props) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const isSuperAdmin = useIsSuperAdmin()
  const { data: department } = useSuspenseQuery(departmentQueryOptions(departmentId))
  const { data: specializations } = useSuspenseQuery(specializationsQueryOptions())

  const { target: showDeleteConfirm, open: openDeleteConfirm, close: closeDeleteConfirm } = useConfirmDelete()
  const [addingSpecializationId, setAddingSpecializationId] = useState('')

  const updateMutation = useMutation({
    mutationFn: updateDepartmentFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDepartmentFn,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['departments', departmentId] })
      queryClient.invalidateQueries({ queryKey: ['departments'], exact: true })
      void navigate({ to: '/departments' })
    },
  })

  const assignMutation = useMutation({
    mutationFn: updateSpecializationDepartmentFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments', departmentId] })
      queryClient.invalidateQueries({ queryKey: ['specializations'] })
    },
  })

  function handleSave(overrides?: Partial<{ name: string; description: string | null }>) {
    updateMutation.mutate({
      id: departmentId,
      name: department.name,
      description: department.description,
      ...overrides,
    })
  }

  function handleAdd() {
    if (!addingSpecializationId) return
    assignMutation.mutate({ id: Number(addingSpecializationId), department_id: departmentId })
    setAddingSpecializationId('')
  }

  function handleRemove(specializationId: number) {
    assignMutation.mutate({ id: specializationId, department_id: null })
  }

  const availableSpecializations = specializations.filter(s => s.department_id !== departmentId)

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        {isSuperAdmin ? (
          <>
            <div className="flex items-start justify-between mb-4">
              <EditableText
                value={department.name}
                onSave={(v) => handleSave({ name: v })}
                as="h1"
                className="text-xl font-semibold text-gray-900"
                required
              />
              <Button
                variant="danger"
                className="ml-4 shrink-0"
                onClick={openDeleteConfirm}
              >
                Delete
              </Button>
            </div>
            <EditableText
              value={department.description ?? ''}
              onSave={(v) => handleSave({ description: v || null })}
              className="text-sm text-gray-600 min-h-[2rem]"
              multiline
              placeholder={<span className="text-gray-400 italic">No description — double-click to add</span>}
            />
            {showDeleteConfirm && (
              <ConfirmDialog
                message={`Delete "${department.name}"? This cannot be undone.`}
                onConfirm={() => deleteMutation.mutate(departmentId)}
                onCancel={closeDeleteConfirm}
                confirmLabel="Delete"
                isDestructive
              />
            )}
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">{department.name}</h1>
            {department.description && (
              <p className="text-sm text-gray-600 italic mb-3">{department.description}</p>
            )}
          </>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Specializations</h2>
        {department.specializations.length === 0 ? (
          <p className="text-sm text-gray-500 mb-3">No specializations in this department yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 mb-3">
            {department.specializations.map(s => (
              <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-900">{s.title}</span>
                {isSuperAdmin && (
                  <Button
                    variant="secondary"
                    onClick={() => handleRemove(s.id)}
                    disabled={assignMutation.isPending}
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {isSuperAdmin && (
          <div className="flex gap-2 items-center pt-2 border-t border-gray-100">
            <select
              className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={addingSpecializationId}
              onChange={e => setAddingSpecializationId(e.target.value)}
              disabled={assignMutation.isPending}
            >
              <option value="">Add a specialization…</option>
              {availableSpecializations.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title} {s.department ? `(currently: ${s.department.name})` : '(unassigned)'}
                </option>
              ))}
            </select>
            <Button
              type="button"
              onClick={handleAdd}
              disabled={!addingSpecializationId || assignMutation.isPending}
            >
              Add
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
