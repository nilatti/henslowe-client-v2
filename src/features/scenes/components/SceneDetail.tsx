import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { sceneQueryOptions, useDeleteScene } from "../api/scenes";
import { actQueryOptions } from "../../acts/api/acts";
import { playSkeletonQueryOptions } from "../../plays/api/plays";
import { SceneForm } from "./SceneForm";
import { FrenchSceneForm } from "../../french_scenes/components/FrenchSceneForm";
import { useIsPlayAdmin } from "../../../hooks/useUserRole";
import {
  Button,
  Card,
  ConfirmDialog,
  PageHeader,
} from "../../../components/ui";

interface SceneDetailProps {
  playId: number;
  actId: number;
  sceneId: number;
}

export function SceneDetail({ playId, actId, sceneId }: SceneDetailProps) {
  const { data: scene } = useSuspenseQuery(sceneQueryOptions(sceneId));
  const { data: act } = useSuspenseQuery(actQueryOptions(actId));
  const { data: playSkeleton } = useSuspenseQuery(playSkeletonQueryOptions(playId));
  const deleteScene = useDeleteScene(playId, actId);
  const isAdmin = useIsPlayAdmin(playId);
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const prettyName = `${act.number}.${scene.number}`;

  const allScenes = playSkeleton.acts.flatMap(a =>
    a.scenes.map(s => ({ id: s.id, prettyName: s.pretty_name, actId: a.id }))
  );
  const sceneIndex = allScenes.findIndex(s => s.id === sceneId);
  const prevScene = sceneIndex > 0 ? allScenes[sceneIndex - 1] : null;
  const nextScene = sceneIndex < allScenes.length - 1 ? allScenes[sceneIndex + 1] : null;

  const title = scene.heading
    ? `Scene ${prettyName}: ${scene.heading}`
    : `Scene ${prettyName}`;

  const lastFrenchScene = scene.french_scenes[scene.french_scenes.length - 1];
  const nextFrenchSceneNumber = lastFrenchScene
    ? String.fromCharCode(lastFrenchScene.number.toString().charCodeAt(0) + 1)
    : "a";

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
          Act {act.number}
        </Link>
        <span className="text-gray-400">→</span>
        <span className="text-gray-600">Scene {prettyName}</span>
      </div>

      <PageHeader
        title={title}
        action={
          isAdmin && (
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

      {isEditing && (
        <Card className="p-6 mb-6">
          <SceneForm
            playId={playId}
            actId={actId}
            scene={scene}
            onSuccess={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        </Card>
      )}

      <div className="space-y-6">
        {(scene.summary || scene.start_page || scene.heading) && (
          <Card className="p-6">
            <dl className="space-y-3 text-sm">
              {scene.heading && (
                <div>
                  <dt className="font-medium text-gray-700">Heading</dt>
                  <dd className="text-gray-600 mt-1 leading-relaxed">
                    {scene.heading}
                  </dd>
                </div>
              )}
              {scene.summary && (
                <div>
                  <dt className="font-medium text-gray-700">Summary</dt>
                  <dd className="text-gray-600 mt-1 leading-relaxed whitespace-pre-wrap">
                    {scene.summary}
                  </dd>
                </div>
              )}
              {scene.start_page && (
                <div>
                  <dt className="font-medium text-gray-700">Pages</dt>
                  <dd className="text-gray-600 mt-1">
                    {scene.start_page}
                    {scene.end_page ? ` – ${scene.end_page}` : ""}
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
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            French Scenes
          </h2>

          <Card>
            {scene.french_scenes.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-500">
                No french scenes yet.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {scene.french_scenes.map((fs) => (
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
                      <div>
                        <span className="text-gray-900">
                          French Scene {prettyName}.{fs.number}
                        </span>
                        {fs.summary && (
                          <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-wrap">{fs.summary}</p>
                        )}
                        {fs.songs.length > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">{fs.songs.map(s => s.title).join(' · ')}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        {fs.start_page && (
                          <p className="text-xs text-gray-400">
                            p. {fs.start_page}{fs.end_page ? `–${fs.end_page}` : ''}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {fs.on_stages.length} on stage{fs.on_stages.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
      {isAdmin && !showForm && (
        <Button className="mb-3" onClick={() => setShowForm(true)}>
          Add French Scene
        </Button>
      )}

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

      {(prevScene || nextScene) && (
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
          {prevScene ? (
            <Link
              to="/plays/$playId/acts/$actId/scenes/$sceneId"
              params={{ playId: String(playId), actId: String(prevScene.actId), sceneId: String(prevScene.id) }}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← Scene {prevScene.prettyName}
            </Link>
          ) : <span />}
          {nextScene ? (
            <Link
              to="/plays/$playId/acts/$actId/scenes/$sceneId"
              params={{ playId: String(playId), actId: String(nextScene.actId), sceneId: String(nextScene.id) }}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Scene {nextScene.prettyName} →
            </Link>
          ) : <span />}
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete Scene ${prettyName}? This will delete all french scenes within it.`}
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deleteScene.mutateAsync(sceneId);
            navigate({
              to: "/plays/$playId/acts/$actId",
              params: { playId: String(playId), actId: String(actId) },
            });
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
