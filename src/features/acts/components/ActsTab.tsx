import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useDeleteAct } from '../api/acts'
import { ActForm } from './ActForm'
import type { PlaySkeleton } from '../../plays/types/play'
import { useIsSuperAdmin } from '../../../hooks/useUserRole'
import { Button, Card, ConfirmDialog } from '../../../components/ui'

interface ActsTabProps {
  play: PlaySkeleton
  playId: number
}

export function ActsTab({ play, playId }: ActsTabProps) {
  const deleteAct = useDeleteAct(playId)
  const isSuperAdmin = useIsSuperAdmin()

  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const nextActNumber = (play.acts[play.acts.length - 1]?.number ?? 0) + 1

  return (
    <div className="space-y-4">
      {isSuperAdmin && !showForm && (
        <Button onClick={() => setShowForm(true)}>Add Act</Button>
      )}

      {showForm && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Add Act
          </h3>
          <ActForm
            playId={playId}
            nextNumber={nextActNumber}
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      {play.acts.map(act => (
        <Card key={act.id}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <Link
              to="/plays/$playId/acts/$actId"
              params={{ playId: String(playId), actId: String(act.id) }}
              className="text-sm font-semibold text-gray-900 hover:text-blue-600"
            >
              Act {act.number}
            </Link>
            {isSuperAdmin && (
              <Button
                variant="danger"
                onClick={() => setConfirmDelete(act.id)}
              >
                Delete
              </Button>
            )}
          </div>
          <ul className="divide-y divide-gray-100">
            {act.scenes.map(scene => (
              <li key={scene.id}>
                <Link
                  to="/plays/$playId/acts/$actId/scenes/$sceneId"
                  params={{
                    playId: String(playId),
                    actId: String(act.id),
                    sceneId: String(scene.id),
                  }}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-sm"
                >
                  <span className="text-gray-700">
                    Scene {scene.pretty_name}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {scene.french_scenes?.length ?? 0} french scene
                    {scene.french_scenes?.length !== 1 ? 's' : ''}
                  </span>
                </Link>
              </li>
            ))}
            {act.scenes.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-400 italic">
                No scenes yet.
              </li>
            )}
          </ul>
        </Card>
      ))}

      {confirmDelete !== null && (
        <ConfirmDialog
          message="Delete this act? This will delete all scenes and french scenes within it."
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deleteAct.mutateAsync(confirmDelete)
            setConfirmDelete(null)
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
