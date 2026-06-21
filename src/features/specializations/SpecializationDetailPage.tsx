import { useEffect, useState } from 'react'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import _ from 'lodash'
import { useIsSuperAdmin } from '../../hooks/useUserRole'
import { specializationQueryOptions, updateSpecializationFn, deleteSpecializationFn } from './queries'
import { phasesQueryOptions } from '../phases/queries'
import { Button, ConfirmDialog } from '../../components/ui'
import { UserLink } from '../../utils/actorUtils'
import type { SpecializationContext, SpecializationJob, SpecializationUser } from './types'

interface Props {
  specializationId: number
}

function getUniqueUsers(jobs: SpecializationJob[]): SpecializationUser[] {
  const users = jobs.map(j => j.user).filter((u): u is SpecializationUser => !!u && !u.fake)
  return _.sortBy(_.uniqBy(users, 'id'), ['last_name', 'first_name', 'email'])
}

export function SpecializationDetailPage({ specializationId }: Props) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const isSuperAdmin = useIsSuperAdmin()
  const { data: specialization } = useSuspenseQuery(specializationQueryOptions(specializationId))
  const { data: phases } = useSuspenseQuery(phasesQueryOptions())

  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [titleInput, setTitleInput] = useState(specialization.title)
  const [descriptionInput, setDescriptionInput] = useState(specialization.description ?? '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!editingTitle) setTitleInput(specialization.title)
  }, [specialization.title, editingTitle])

  useEffect(() => {
    if (!editingDescription) setDescriptionInput(specialization.description ?? '')
  }, [specialization.description, editingDescription])

  const updateMutation = useMutation({
    mutationFn: updateSpecializationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specializations'] })
      setEditingTitle(false)
      setEditingDescription(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSpecializationFn,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['specializations', specializationId] })
      queryClient.invalidateQueries({ queryKey: ['specializations'], exact: true })
      void navigate({ to: '/specializations' })
    },
  })

  function handleSave(overrides?: Partial<{ production_admin: boolean; theater_admin: boolean; context: SpecializationContext; default_start_phase_id: number | null; default_end_phase_id: number | null }>) {
    updateMutation.mutate({
      id: specializationId,
      title: titleInput,
      description: descriptionInput || null,
      production_admin: specialization.production_admin,
      theater_admin: specialization.theater_admin,
      context: specialization.context,
      default_start_phase_id: specialization.default_start_phase_id,
      default_end_phase_id: specialization.default_end_phase_id,
      ...overrides,
    })
  }

  function toggleProductionAdmin() {
    handleSave({ production_admin: !specialization.production_admin })
  }

  function toggleTheaterAdmin() {
    handleSave({ theater_admin: !specialization.theater_admin })
  }

  function setDefaultStartPhase(id: number | null) {
    handleSave({ default_start_phase_id: id })
  }

  function setDefaultEndPhase(id: number | null) {
    handleSave({ default_end_phase_id: id })
  }

  const users = getUniqueUsers(specialization.jobs)

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        {isSuperAdmin ? (
          <>
            <div className="flex items-start justify-between mb-4">
              {editingTitle ? (
                <form
                  className="flex-1 flex items-center gap-2"
                  onSubmit={(e) => { e.preventDefault(); handleSave() }}
                >
                  <input
                    autoFocus
                    className="flex-1 text-xl font-semibold border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    required
                  />
                  <Button type="submit" variant="primary">Save</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditingTitle(false)}
                  >
                    Cancel
                  </Button>
                </form>
              ) : (
                <h1
                  className="text-xl font-semibold text-gray-900 cursor-pointer hover:bg-gray-50 rounded px-1 -ml-1"
                  onDoubleClick={() => setEditingTitle(true)}
                  title="Double-click to edit"
                >
                  {specialization.title}
                </h1>
              )}
              {!editingTitle && (
                <Button
                  variant="danger"
                  className="ml-4 shrink-0"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete
                </Button>
              )}
            </div>
            {editingDescription ? (
              <form
                className="space-y-2"
                onSubmit={(e) => { e.preventDefault(); handleSave() }}
              >
                <textarea
                  autoFocus
                  rows={5}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="submit" variant="primary">Save</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditingDescription(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <p
                className="text-sm text-gray-600 cursor-pointer hover:bg-gray-50 rounded px-1 -ml-1 min-h-[2rem]"
                onDoubleClick={() => setEditingDescription(true)}
                title="Double-click to edit"
              >
                {specialization.description ? (
                  <em>{specialization.description}</em>
                ) : (
                  <span className="text-gray-400 italic">No description — double-click to add</span>
                )}
              </p>
            )}
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Context</label>
                <select
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={specialization.context}
                  onChange={e => handleSave({ context: e.target.value as SpecializationContext })}
                  disabled={updateMutation.isPending}
                >
                  <option value="theater">Theater only</option>
                  <option value="production">Production only</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={specialization.production_admin}
                  onChange={toggleProductionAdmin}
                  disabled={updateMutation.isPending}
                  className="rounded border-gray-300"
                />
                Production admin
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={specialization.theater_admin}
                  onChange={toggleTheaterAdmin}
                  disabled={updateMutation.isPending}
                  className="rounded border-gray-300"
                />
                Theater admin
              </label>
            </div>
            {phases.length > 0 && (
              <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Default job date phases</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start phase</label>
                    <select
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={specialization.default_start_phase_id ?? ''}
                      onChange={e => setDefaultStartPhase(e.target.value ? Number(e.target.value) : null)}
                      disabled={updateMutation.isPending}
                    >
                      <option value="">No default</option>
                      {phases.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End phase</label>
                    <select
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={specialization.default_end_phase_id ?? ''}
                      onChange={e => setDefaultEndPhase(e.target.value ? Number(e.target.value) : null)}
                      disabled={updateMutation.isPending}
                    >
                      <option value="">No default</option>
                      {phases.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
            {showDeleteConfirm && (
              <ConfirmDialog
                message={`Delete "${specialization.title}"? This cannot be undone.`}
                onConfirm={() => deleteMutation.mutate(specializationId)}
                onCancel={() => setShowDeleteConfirm(false)}
                confirmLabel="Delete"
                isDestructive
              />
            )}
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">{specialization.title}</h1>
            {specialization.description && (
              <p className="text-sm text-gray-600 italic mb-3">{specialization.description}</p>
            )}
            <div className="space-y-1 text-sm text-gray-600">
              <p>Context: {{ theater: 'Theater only', production: 'Production only', both: 'Both' }[specialization.context]}</p>
              {specialization.production_admin && <p>Production admin</p>}
              {specialization.theater_admin && <p>Theater admin</p>}
            </div>
          </>
        )}
      </div>
      {users.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            People with this specialization
          </h2>
          <ul className="space-y-1">
            {users.map(user => (
              <li key={user.id}>
                <UserLink user={user} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
