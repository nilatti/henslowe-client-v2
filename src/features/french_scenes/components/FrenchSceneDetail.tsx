import { useState } from 'react'
import { useSuspenseQuery, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { frenchSceneQueryOptions, useDeleteFrenchScene } from '../api/frenchScenes'
import { playSkeletonQueryOptions } from '../../plays/api/plays'
import { productionSkeletonQueryOptions } from '../../productions/api/productions'
import { FrenchSceneForm } from './FrenchSceneForm'
import { OnStagesManager } from './OnStagesManager'
import { SongsManager } from './SongsManager'
import { EntranceExitsList } from '../../productions/components/EntranceExits/EntranceExitsList'
import { useIsPlayAdmin } from '../../../hooks/useUserRole'
import {
  Button,
  Card,
  ConfirmDialog,
  PageHeader,
} from '../../../components/ui'

interface FrenchSceneDetailProps {
  playId: number
  actId: number
  sceneId: number
  frenchSceneId: number
}

export function FrenchSceneDetail({
  playId,
  actId,
  sceneId,
  frenchSceneId,
}: FrenchSceneDetailProps) {
  const { data: frenchScene } = useSuspenseQuery(
    frenchSceneQueryOptions(frenchSceneId)
  )
  const { data: playSkeleton } = useSuspenseQuery(
    playSkeletonQueryOptions(playId)
  )
  const { data: productionSkeleton } = useQuery({
    ...productionSkeletonQueryOptions(playSkeleton.production_id ?? 0),
    enabled: playSkeleton.production_id != null,
  })
  const deleteFrenchScene = useDeleteFrenchScene(playId, sceneId)
  const isAdmin = useIsPlayAdmin(playId)
  const navigate = useNavigate()

  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const prettyName = frenchScene.pretty_name ?? `${frenchScene.number}`
  const actNumber = playSkeleton.acts.find(a => a.id === actId)?.number
  const sceneNumber = playSkeleton.acts
    .flatMap(a => a.scenes)
    .find(s => s.id === sceneId)?.number

  const allFrenchScenes = playSkeleton.acts.flatMap(a =>
    a.scenes.flatMap(s =>
      s.french_scenes.map(fs => ({
        id: fs.id,
        label: `${a.number}.${s.number}.${fs.number}`,
        actId: a.id,
        sceneId: s.id,
      }))
    )
  )
  const fsIndex = allFrenchScenes.findIndex(fs => fs.id === frenchSceneId)
  const prevFs = fsIndex > 0 ? allFrenchScenes[fsIndex - 1] : null
  const nextFs = fsIndex < allFrenchScenes.length - 1 ? allFrenchScenes[fsIndex + 1] : null

  return (
    <div>
      <div className="mb-2 flex gap-2 text-sm flex-wrap">
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
          Act {actNumber}
        </Link>
        <span className="text-gray-400">→</span>
        <Link
          to="/plays/$playId/acts/$actId/scenes/$sceneId"
          params={{
            playId: String(playId),
            actId: String(actId),
            sceneId: String(sceneId),
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          Scene {sceneNumber}
        </Link>
        <span className="text-gray-400">→</span>
        <span className="text-gray-600">French Scene {prettyName}</span>
      </div>

      <PageHeader
        title={`French Scene ${prettyName}`}
        action={
          isAdmin ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            </div>
          ) : undefined
        }
      />

      {isEditing ? (
        <Card className="p-6 mb-6">
          <FrenchSceneForm
            playId={playId}
            sceneId={sceneId}
            frenchScene={frenchScene}
            onSuccess={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {(frenchScene.summary || frenchScene.start_page) && (
            <Card className="p-6">
              <dl className="space-y-3 text-sm">
                {frenchScene.summary && (
                  <div>
                    <dt className="font-medium text-gray-700">Summary</dt>
                    <dd className="text-gray-600 mt-1 leading-relaxed whitespace-pre-wrap">
                      {frenchScene.summary}
                    </dd>
                  </div>
                )}
                {frenchScene.start_page && (
                  <div>
                    <dt className="font-medium text-gray-700">Pages</dt>
                    <dd className="text-gray-600 mt-1">
                      {frenchScene.start_page}
                      {frenchScene.end_page ? ` – ${frenchScene.end_page}` : ''}
                    </dd>
                  </div>
                )}
                {frenchScene.original_line_count != null && (
                  <div>
                    <dt className="font-medium text-gray-700">Lines</dt>
                    <dd className="text-gray-600 mt-1">
                      {frenchScene.new_line_count ?? frenchScene.original_line_count}
                      {frenchScene.new_line_count != null &&
                        frenchScene.new_line_count !== frenchScene.original_line_count && (
                          <span className="text-gray-400 ml-1">
                            (originally {frenchScene.original_line_count})
                          </span>
                        )}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
          )}

          <OnStagesManager
            frenchScene={frenchScene}
            playSkeleton={playSkeleton}
          />

          <SongsManager
            frenchScene={frenchScene}
            playSkeleton={playSkeleton}
          />

          {playSkeleton.production_id != null && (
            <Card className="p-4">
              <EntranceExitsList
                frenchSceneId={frenchSceneId}
                productionId={playSkeleton.production_id}
                theaterId={productionSkeleton?.theater.id}
                characters={playSkeleton.characters}
              />
            </Card>
          )}

          <Card className="p-4">
            <p className="text-sm text-gray-400 italic">
              Script content (lines, sound cues, stage directions) coming in a future update.
            </p>
            <Link
              to="/plays/$playId/script"
              params={{ playId: String(playId) }}
              className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
            >
              View full script →
            </Link>
          </Card>
        </div>
      )}

      {(prevFs || nextFs) && (
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
          {prevFs ? (
            <Link
              to="/plays/$playId/acts/$actId/scenes/$sceneId/french-scenes/$frenchSceneId"
              params={{ playId: String(playId), actId: String(prevFs.actId), sceneId: String(prevFs.sceneId), frenchSceneId: String(prevFs.id) }}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← French Scene {prevFs.label}
            </Link>
          ) : <span />}
          {nextFs ? (
            <Link
              to="/plays/$playId/acts/$actId/scenes/$sceneId/french-scenes/$frenchSceneId"
              params={{ playId: String(playId), actId: String(nextFs.actId), sceneId: String(nextFs.sceneId), frenchSceneId: String(nextFs.id) }}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              French Scene {nextFs.label} →
            </Link>
          ) : <span />}
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete French Scene ${prettyName}? This will delete all lines and stage directions within it.`}
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deleteFrenchScene.mutateAsync(frenchSceneId)
            navigate({
              to: '/plays/$playId/acts/$actId/scenes/$sceneId',
              params: {
                playId: String(playId),
                actId: String(actId),
                sceneId: String(sceneId),
              },
            })
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
