import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { sceneQueryOptions, useDeleteScene } from '../api/scenes'
import { SceneForm } from './SceneForm'
import { FrenchSceneForm } from '../../french_scenes/components/FrenchSceneForm'
import { useIsSuperAdmin } from '../../../hooks/useUserRole'
import {
  Button,
  Card,
  ConfirmDialog,
  PageHeader,
} from '../../../components/ui'

interface SceneDetailProps {
  playId: number
  actId: number
  sceneId: number
}

export function SceneDetail({ playId, actId, sceneId }: SceneDetailProps) {
  const { data: scene } = useSuspenseQuery(sceneQueryOptions(sceneId))
  const deleteScene = useDeleteScene(playId, actId)
  const isSuperAdmin = useIsSuperAdmin()
  const navigate = useNavigate()

  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const title = scene.heading
    ? `Scene ${scene.pretty_name}: ${scene.heading}`
    : `Scene ${scene.pretty_name}`

  const lastFrenchScene = scene.french_scenes[scene.french_scenes.length - 1]
  const nextFrenchSceneNumber = lastFrenchScene
    ? String.fromCharCode(lastFrenchScene.number.toString().charCodeAt(0) + 1)
    : 'a'

  return (
    <div>
      <div className="mb-2 flex gap-2 text-sm">
        <Link
          to="/plays/$playId"
          params={{ playId: String(playId) }}
          className="text-blue-600 hover:text-blue-800"
        >
          Play
        </Link>
        <span className="text-gray-400">→</span>
        <Link
          to="/plays/$playId/acts/$actId"
          params={{ playId: String(playId), actId: String(actId) }}
          className="text-blue-600 hover:text-blue-800"
        >
          Act {scene.pretty_name.split('.')[0]}
        </Link>
        <span className="text-gray-400">→</span>
        <span className="text-gray-600">Scene {scene.pretty_name}</span>
      </div>

      <PageHeader
        title={title}
        action={
          isSuperAdmin && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            </div>
          )
        }
      />

      {isEditing ? (
        <Card className="p-6 mb-6">
          <SceneForm
            playId={playId}
            actId={actId}
            scene={scene}
            onSuccess={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {(scene.summary || scene.start_page) && (
            <Card className="p-6">
              <dl className="space-y-3 text-sm">
                {scene.summary && (
                  <div>
                    <dt className="font-medium text-gray-700">Summary</dt>
                    <dd className="text-gray-600 mt-1 leading-relaxed">
                      {scene.summary}
                    </dd>
                  </div>
                )}
                {scene.start_page && (
                  <div>
                    <dt className="font-medium text-gray-700">Pages</dt>
                    <dd className="text-gray-600 mt-1">
                      {scene.start_page}
                      {scene.end_page ? ` – ${scene.end_page}` : ''}
                    </dd>
                  </div>
                )}
                {scene.original_line_count != null && (
                  <div>
                    <dt className="font-medium text-gray-700">Lines</dt>
                    <dd className="text-gray-600 mt-1">
                      {scene.new_line_count ?? scene.original_line_count}
                      {scene.new_line_count != null &&
                        scene.new_line_count !== scene.original_line_count && (
                          <span className="text-gray-400 ml-1">
                            (originally {scene.original_line_count})
                          </span>
                        )}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-gray-900">
                French Scenes
              </h2>
              {isSuperAdmin && !showForm && (
                <Button onClick={() => setShowForm(true)}>
                  + Add French Scene
                </Button>
              )}
            </div>

            {showForm && (
              <Card className="p-6 mb-4">
                <FrenchSceneForm
                  playId={playId}
                  sceneId={sceneId}
                  nextNumber={nextFrenchSceneNumber}
                  onSuccess={() => setShowForm(false)}
                  onCancel={() => setShowForm(false)}
                />
              </Card>
            )}

            <Card>
              {scene.french_scenes.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500">
                  No french scenes yet.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {scene.french_scenes.map(fs => (
                    <li key={fs.id}>
                      <Link
                        to="/plays/$playId/acts/$actId/scenes/$sceneId/french-scenes/$frenchSceneId"
                        params={{
                          playId: String(playId),
                          actId: String(actId),
                          sceneId: String(sceneId),
                          frenchSceneId: String(fs.id),
                        }}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-sm"
                      >
                        <span className="text-gray-900">
                          French Scene {scene.pretty_name}.{fs.number}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {fs.on_stages.length} on stage
                          {fs.on_stages.length !== 1 ? 's' : ''}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete Scene ${scene.pretty_name}? This will delete all french scenes within it.`}
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deleteScene.mutateAsync(sceneId)
            navigate({
              to: '/plays/$playId/acts/$actId',
              params: { playId: String(playId), actId: String(actId) },
            })
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
