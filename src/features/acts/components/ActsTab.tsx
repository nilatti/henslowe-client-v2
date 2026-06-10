import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useDeleteAct } from "../api/acts";
import { ActForm } from "./ActForm";
import type { PlaySkeleton } from "../../plays/types/play";
import { useIsPlayAdmin } from "../../../hooks/useUserRole";
import { Button, Card, ConfirmDialog } from "../../../components/ui";

interface ActsTabProps {
  play: PlaySkeleton;
  playId: number;
}

export function ActsTab({ play, playId }: ActsTabProps) {
  const deleteAct = useDeleteAct(playId);
  const isAdmin = useIsPlayAdmin(playId);

  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const nextActNumber = (play.acts[play.acts.length - 1]?.number ?? 0) + 1;

  return (
    <div className="space-y-4">
      {play.acts.map((act) => (
        <Card key={act.id}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <Link
                to="/plays/$playId/acts/$actId"
                params={{ playId: String(playId), actId: String(act.id) }}
                className="text-sm font-semibold text-gray-900 hover:text-blue-600"
              >
                Act {act.number}
              </Link>
              {act.summary && (
                <p className="text-xs text-gray-500 mt-0.5">{act.summary}</p>
              )}
            </div>
            {isAdmin && (
              <Button variant="danger" onClick={() => setConfirmDelete(act.id)}>
                Delete
              </Button>
            )}
          </div>
          <ul className="divide-y divide-gray-100">
            {act.scenes.map((scene) => (
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
                  <div>
                    <span className="text-gray-700">
                      Scene {scene.pretty_name}{scene.heading ? `: ${scene.heading}` : ''}
                    </span>
                    {scene.summary && (
                      <p className="text-xs text-gray-500 mt-0.5">{scene.summary}</p>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs shrink-0 ml-4">
                    {scene.french_scenes?.length ?? 0} french scene
                    {scene.french_scenes?.length !== 1 ? "s" : ""}
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
      {isAdmin && !showForm && (
        <Button onClick={() => setShowForm(true)}>Add Act</Button>
      )}

      {showForm && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Add Act</h3>
          <ActForm
            playId={playId}
            nextNumber={nextActNumber}
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      {confirmDelete !== null && (
        <ConfirmDialog
          message="Delete this act? This will delete all scenes and french scenes within it."
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deleteAct.mutateAsync(confirmDelete);
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
