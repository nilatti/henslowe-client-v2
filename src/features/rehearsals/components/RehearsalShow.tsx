import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { parseISO, format } from "date-fns";
import {
  useDeleteRehearsal,
  type ProductionUserConflict,
} from "../api/rehearsals";
import type { RehearsalWithDetails, RehearsalUser } from "../types/rehearsal";
import { RehearsalForm } from "./RehearsalForm";
import { RehearsalContentManager } from "./content/RehearsalContentManager";
import { RehearsalPeopleManager } from "./people/RehearsalPeopleManager";
import { Button, ConfirmDialog } from "../../../components/ui";
import { buildUserName } from "../../../utils/actorUtils";
import { rehearsalContent } from "../../../utils/rehearsalUtils";
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
  actorCharacterNames,
}: RehearsalShowProps) {
  const deleteRehearsal = useDeleteRehearsal(productionId);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showContentManager, setShowContentManager] = useState(false);
  const [showPeopleManager, setShowPeopleManager] = useState(false);

  const rehearsalStartDate = parseISO(rehearsal.start_time);
  const rehearsalEndDate = parseISO(rehearsal.end_time);

  const startTime = format(rehearsalStartDate, "h:mm a");
  const endTime = format(rehearsalEndDate, "h:mm a");

  const conflictedUserIds = getConflictedUserIds(
    rehearsal.users,
    productionUserConflicts,
    rehearsalStartDate,
    rehearsalEndDate,
  );

  const content = rehearsalContent({
    acts: rehearsal.acts as never,
    frenchScenes: rehearsal.french_scenes as never,
    scenes: rehearsal.scenes as never,
  });

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
    <div className="py-3 border-t border-gray-100">
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
            <div className="mb-1">
              <Link
                to="/spaces/$spaceId"
                params={{ spaceId: String(rehearsal.space.id) }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {rehearsal.space.name}
              </Link>
            </div>
          )}

          {rehearsal.notes && (
            <p className="text-xs text-gray-500 mb-2">{rehearsal.notes}</p>
          )}

          {content.length > 0 && (
            <div className="text-xs text-gray-600 mb-2">
              <span className="font-medium">Content: </span>
              {content.join(", ")}
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
                      {buildUserName(u)}
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
                      {buildUserName(u)}
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
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
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
          onConfirm={async () => {
            await deleteRehearsal.mutateAsync(rehearsal.id);
            setConfirmDelete(false);
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
