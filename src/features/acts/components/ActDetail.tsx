import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { actQueryOptions, useDeleteAct } from "../api/acts";
import { playSkeletonQueryOptions } from "../../plays/api/plays";
import { ActForm } from "./ActForm";
import { SceneForm } from "../../scenes/components/SceneForm";
import { useIsPlayAdmin } from "../../../hooks/useUserRole";
import {
  Button,
  Card,
  ConfirmDialog,
  PageHeader,
} from "../../../components/ui";

interface ActDetailProps {
  playId: number;
  actId: number;
}

export function ActDetail({ playId, actId }: ActDetailProps) {
  const { data: act } = useSuspenseQuery(actQueryOptions(actId));
  const { data: playSkeleton } = useSuspenseQuery(playSkeletonQueryOptions(playId));
  const deleteAct = useDeleteAct(playId);
  const isAdmin = useIsPlayAdmin(playId);
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const lastScene = act.scenes[act.scenes.length - 1];
  const nextSceneNumber = lastScene ? Number(lastScene.number) + 1 : 1;

  const actIndex = playSkeleton.acts.findIndex(a => a.id === actId);
  const prevAct = actIndex > 0 ? playSkeleton.acts[actIndex - 1] : null;
  const nextAct = actIndex < playSkeleton.acts.length - 1 ? playSkeleton.acts[actIndex + 1] : null;

  const title = act.heading
    ? `Act ${act.number}: ${act.heading}`
    : `Act ${act.number}`;

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/plays/$playId"
          params={{ playId: String(playId) }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to play
        </Link>
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

      {isEditing ? (
        <Card className="p-6 mb-6">
          <ActForm
            playId={playId}
            act={act}
            onSuccess={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {(act.summary || act.start_page || act.heading) && (
            <Card className="p-6">
              <dl className="space-y-3 text-sm">
                {act.heading && (
                  <div>
                    <dt className="font-medium text-gray-700">Heading</dt>
                    <dd className="text-gray-600 mt-1 leading-relaxed">
                      {act.heading}
                    </dd>
                  </div>
                )}
                {act.summary && (
                  <div>
                    <dt className="font-medium text-gray-700">Summary</dt>
                    <dd className="text-gray-600 mt-1 leading-relaxed">
                      {act.summary}
                    </dd>
                  </div>
                )}
                {act.start_page && (
                  <div>
                    <dt className="font-medium text-gray-700">Pages</dt>
                    <dd className="text-gray-600 mt-1">
                      {act.start_page}
                      {act.end_page ? ` – ${act.end_page}` : ""}
                    </dd>
                  </div>
                )}
                {act.original_line_count != null && (
                  <div>
                    <dt className="font-medium text-gray-700">Lines</dt>
                    <dd className="text-gray-600 mt-1">
                      {act.new_line_count ?? act.original_line_count}
                      {act.new_line_count != null &&
                        act.new_line_count !== act.original_line_count && (
                          <span className="text-gray-400 ml-1">
                            (originally {act.original_line_count})
                          </span>
                        )}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
          )}

          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-3">Scenes</h2>

            <Card>
              {act.scenes.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500">
                  No scenes yet.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {act.scenes.map((scene) => {
                    const songs = scene.french_scenes?.flatMap(fs => fs.songs) ?? []
                    return (
                      <li key={scene.id}>
                        <Link
                          to="/plays/$playId/acts/$actId/scenes/$sceneId"
                          params={{
                            playId: String(playId),
                            actId: String(actId),
                            sceneId: String(scene.id),
                          }}
                          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-sm"
                        >
                          <div>
                            <span className="text-gray-900">Scene {scene.number}</span>
                            {songs.length > 0 && (
                              <p className="text-xs text-gray-400 mt-0.5">{songs.map(s => s.title).join(' · ')}</p>
                            )}
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
            {isAdmin && !showForm && (
              <Button className="mt-3" onClick={() => setShowForm(true)}>
                Add Scene
              </Button>
            )}
            {showForm && (
              <Card className="p-6 mt-3">
                <SceneForm
                  playId={playId}
                  actId={actId}
                  nextNumber={nextSceneNumber}
                  onSuccess={() => setShowForm(false)}
                  onCancel={() => setShowForm(false)}
                />
              </Card>
            )}
          </div>
        </div>
      )}

      {(prevAct || nextAct) && (
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
          {prevAct ? (
            <Link
              to="/plays/$playId/acts/$actId"
              params={{ playId: String(playId), actId: String(prevAct.id) }}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← Act {prevAct.number}
            </Link>
          ) : <span />}
          {nextAct ? (
            <Link
              to="/plays/$playId/acts/$actId"
              params={{ playId: String(playId), actId: String(nextAct.id) }}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Act {nextAct.number} →
            </Link>
          ) : <span />}
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete Act ${act.number}? This will delete all scenes and french scenes within it.`}
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deleteAct.mutateAsync(actId);
            navigate({
              to: "/plays/$playId",
              params: { playId: String(playId) },
            });
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
