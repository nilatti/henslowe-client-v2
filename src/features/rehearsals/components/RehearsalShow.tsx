import { useState, Fragment } from "react";
import { Link } from "@tanstack/react-router";
import { useConfirmDelete } from "../../../hooks/useConfirmDelete";
import { parseISO, format } from "date-fns";
import {
  useDeleteRehearsal,
  type ProductionUserConflict,
  type ProductionSpaceConflict,
} from "../api/rehearsals";
import type { RehearsalWithDetails, RehearsalUser } from "../types/rehearsal";
import { RehearsalForm } from "./RehearsalForm";
import { RehearsalContentManager } from "./content/RehearsalContentManager";
import { RehearsalPeopleManager } from "./people/RehearsalPeopleManager";
import { Button, ConfirmDialog } from "../../../components/ui";
import { buildUserName } from "../../../utils/actorUtils";
import { getConflictedUserIds } from "../../conflicts/utils/conflictUtils";

interface RehearsalShowProps {
  rehearsal: RehearsalWithDetails;
  productionId: number;
  playId: number;
  theaterId: number;
  actors: RehearsalUser[];
  productionStaff: RehearsalUser[];
  isAdmin: boolean;
  productionUserConflicts: ProductionUserConflict[];
  productionSpaceConflicts: ProductionSpaceConflict[];
  actorCharacterNames?: Map<number, string[]>;
}

export function RehearsalShow({
  rehearsal,
  productionId,
  playId,
  theaterId,
  actors,
  productionStaff,
  isAdmin,
  productionUserConflicts,
  productionSpaceConflicts,
  actorCharacterNames,
}: RehearsalShowProps) {
  const deleteRehearsal = useDeleteRehearsal(productionId);
  const [isEditing, setIsEditing] = useState(false);
  const { target: confirmDelete, open: requestDelete, close: clearDelete } = useConfirmDelete();
  const [showContentManager, setShowContentManager] = useState(false);
  const [showPeopleManager, setShowPeopleManager] = useState(false);

  const rehearsalStartDate = parseISO(rehearsal.start_time);
  const rehearsalEndDate = parseISO(rehearsal.end_time);

  const startTime = format(rehearsalStartDate, "h:mm a");
  const endTime = format(rehearsalEndDate, "h:mm a");

  const spaceDoubleBooked = (() => {
    if (!rehearsal.space) return false;
    const entry = productionSpaceConflicts.find((s) => s.space.id === rehearsal.space!.id);
    if (!entry) return false;
    return entry.conflicts.some((c) => {
      if (c.rehearsal_id === rehearsal.id) return false;
      return parseISO(c.start_time) < rehearsalEndDate && parseISO(c.end_time) > rehearsalStartDate;
    });
  })();

  const conflictedUserIds = getConflictedUserIds(
    rehearsal.users,
    productionUserConflicts,
    rehearsalStartDate,
    rehearsalEndDate,
    rehearsal.id,
  );

  const pageRange = (item: { start_page?: number | null; end_page?: number | null }) => {
    if (item.start_page == null || item.end_page == null) return null;
    return item.start_page === item.end_page
      ? ` (p. ${item.start_page})`
      : ` (pp. ${item.start_page}–${item.end_page})`;
  };

  const contentLinks = [
    ...rehearsal.acts.map((act) => ({
      key: `act-${act.id}`,
      node: act.play_id ? (
        <><Link to="/plays/$playId/acts/$actId" params={{ playId: String(act.play_id), actId: String(act.id) }} className="text-blue-600 hover:underline">
          {act.heading}
        </Link>{pageRange(act)}</>
      ) : <span>{act.heading}{pageRange(act)}</span>,
    })),
    ...rehearsal.scenes.map((scene) => ({
      key: `scene-${scene.id}`,
      node: scene.act_id ? (
        <><Link to="/plays/$playId/acts/$actId/scenes/$sceneId" params={{ playId: String(playId), actId: String(scene.act_id), sceneId: String(scene.id) }} className="text-blue-600 hover:underline">
          {scene.pretty_name}
        </Link>{pageRange(scene)}</>
      ) : <span>{scene.pretty_name}{pageRange(scene)}</span>,
    })),
    ...rehearsal.french_scenes.map((fs) => ({
      key: `fs-${fs.id}`,
      node: fs.scene ? (
        <><Link to="/plays/$playId/acts/$actId/scenes/$sceneId/french-scenes/$frenchSceneId" params={{ playId: String(playId), actId: String(fs.scene.act_id), sceneId: String(fs.scene_id ?? fs.scene.id), frenchSceneId: String(fs.id) }} className="text-blue-600 hover:underline">
          {fs.pretty_name}
        </Link>{pageRange(fs)}</>
      ) : <span>{fs.pretty_name}{pageRange(fs)}</span>,
    })),
  ];

  if (isEditing) {
    return (
      <div className="py-3">
        <RehearsalForm
          productionId={productionId}
          theaterId={theaterId}
          rehearsal={rehearsal}
          onSuccess={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="py-3 border-t border-gray-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm font-medium text-gray-900">
              {startTime} – {endTime}
            </span>
            {rehearsal.title && (
              <span className="text-sm text-gray-600">{rehearsal.title}</span>
            )}
          </div>
          {rehearsal.space && (
            <div className="mb-1 flex items-center gap-2">
              <Link
                to="/spaces/$spaceId"
                params={{ spaceId: String(rehearsal.space.id) }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {rehearsal.space.name}
              </Link>
              {spaceDoubleBooked && (
                <span className="text-xs text-red-600">Warning: Space is double booked</span>
              )}
            </div>
          )}

          {rehearsal.notes && (
            <p className="text-xs text-gray-500 mb-2">{rehearsal.notes}</p>
          )}

          {contentLinks.length > 0 && (
            <div className="text-xs text-gray-600 mb-2">
              <span className="font-medium">Content: </span>
              {contentLinks.map(({ key, node }, i) => (
                <Fragment key={key}>
                  {node}{i < contentLinks.length - 1 && ", "}
                </Fragment>
              ))}
            </div>
          )}

          {rehearsal.users.length > 0 && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Actors Called: </span>
              <ul className="list-disc list-inside">
                {rehearsal.users
                  .filter((u) => actors.some((a) => a.id === u.id))
                  .map((u) => (
                    <li
                      key={u.id}
                      className={
                        conflictedUserIds.has(u.id) ? "text-red-600" : undefined
                      }
                    >
                      <Link to="/users/$userId" params={{ userId: String(u.id) }} className="hover:underline">
                        {buildUserName(u)}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          )}
          {rehearsal.users.length > 0 && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Production Staff Called: </span>
              <ul className="list-disc list-inside">
                {rehearsal.users
                  .filter((u) => productionStaff.some((ps) => ps.id === u.id))
                  .map((u) => (
                    <li
                      key={u.id}
                      className={
                        conflictedUserIds.has(u.id) ? "text-red-600" : undefined
                      }
                    >
                      <Link to="/users/$userId" params={{ userId: String(u.id) }} className="hover:underline">
                        {buildUserName(u)}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="flex gap-2 ml-4 shrink-0">
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button variant="danger" onClick={requestDelete}>
              Delete
            </Button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="mt-3 flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setShowContentManager(!showContentManager);
              setShowPeopleManager(false);
            }}
          >
            {showContentManager ? "Hide content" : "Edit content"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setShowPeopleManager(!showPeopleManager);
              setShowContentManager(false);
            }}
          >
            {showPeopleManager ? "Hide call list" : "Edit call list"}
          </Button>
        </div>
      )}

      {showContentManager && (
        <div className="mt-3">
          <RehearsalContentManager
            rehearsal={rehearsal}
            productionId={productionId}
            playId={playId}
            actors={actors}
            productionStaff={productionStaff}
            onClose={() => setShowContentManager(false)}
            productionUserConflicts={productionUserConflicts}
          />
        </div>
      )}

      {showPeopleManager && (
        <div className="mt-3">
          <RehearsalPeopleManager
            rehearsal={rehearsal}
            productionId={productionId}
            actors={actors}
            productionStaff={productionStaff}
            setShowPeopleManager={setShowPeopleManager}
            productionUserConflicts={productionUserConflicts}
            actorCharacterNames={actorCharacterNames}
          />
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message="Delete this rehearsal?"
          isDestructive
          confirmLabel="Delete"
          onConfirm={() => {
            clearDelete();
            deleteRehearsal.mutate(rehearsal.id);
          }}
          onCancel={clearDelete}
        />
      )}
    </div>
  );
}
