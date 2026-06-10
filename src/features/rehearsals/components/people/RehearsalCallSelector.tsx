import { useMemo } from "react";
import { buildUserName } from "../../../../utils/actorUtils";
import { getConflictsForUserForRehearsal } from "../../../conflicts/utils/conflictUtils";
import type { ProductionUserConflict } from "../../api/rehearsals";
import type { RehearsalUser } from "../../types/rehearsal";
import type { Conflict } from "../../../conflicts/types/conflict";
import { Button } from "../../../../components/ui/Button";

interface RehearsalCallSelectorProps {
  actors: RehearsalUser[];
  productionStaff: RehearsalUser[];
  selectedIds: number[];
  handleToggle: (userId: number) => void;
  productionUserConflicts?: ProductionUserConflict[];
  rehearsalStartDate?: Date;
  rehearsalEndDate?: Date;
}

export default function RehearsalCallSelector({
  actors,
  productionStaff,
  selectedIds,
  handleToggle,
  rehearsalStartDate,
  rehearsalEndDate,
  productionUserConflicts = [],
}: RehearsalCallSelectorProps) {
  const conflictMap = useMemo(() => {
    const map = new Map<number, Conflict[]>();

    if (!rehearsalStartDate || !rehearsalEndDate) {
      return map;
    }

    for (const user of [...actors, ...productionStaff]) {
      map.set(
        user.id,
        getConflictsForUserForRehearsal(
          user.id,
          productionUserConflicts,
          rehearsalStartDate,
          rehearsalEndDate,
        ),
      );
    }

    return map;
  }, [
    actors,
    productionStaff,
    productionUserConflicts,
    rehearsalStartDate,
    rehearsalEndDate,
  ]);

  const formatConflicts = (conflicts: Conflict[]) =>
    conflicts.length ? (
      <span className="text-red-500">
        (Rehearsal conflict:{" "}
        {conflicts
          .map(
            (conflict) =>
              `${new Date(conflict.start_time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })} - ${new Date(conflict.end_time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}`,
          )
          .join(", ")}
        )
      </span>
    ) : null;

  const actorIds = actors.map((a) => a.id);
  const allActorsSelected = actorIds.length > 0 && actorIds.every((id) => selectedIds.includes(id));

  const selectAllActors = () => {
    if (allActorsSelected) {
      // Deselect all
      actorIds.forEach((id) => handleToggle(id));
    } else {
      // Select all
      actorIds.forEach((id) => {
        if (!selectedIds.includes(id)) {
          handleToggle(id);
        }
      });
    }
  };
  return (
    <>
      <h5>Actors</h5>
      <div className="space-y-1 mb-4">
        <Button variant="secondary" onClick={selectAllActors}>
          {allActorsSelected ? "Clear All Actors" : "Call All Actors"}
        </Button>
        {[...actors]
          .sort((a, b) => a.last_name.localeCompare(b.last_name))
          .map((u) => (
            <label
              key={u.id}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(u.id)}
                onChange={() => handleToggle(u.id)}
                className="rounded border-gray-300"
              />
              {buildUserName(u)}
              {formatConflicts(conflictMap.get(u.id) ?? [])}
            </label>
          ))}
      </div>
      <h5>Production staff</h5>
      <div className="space-y-1 mb-4">
        {[...productionStaff]
          .sort((a, b) => a.last_name.localeCompare(b.last_name))
          .map((u) => (
            <label
              key={u.id}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(u.id)}
                onChange={() => handleToggle(u.id)}
                className="rounded border-gray-300"
              />
              {buildUserName(u)}
              {formatConflicts(conflictMap.get(u.id) ?? [])} - {u.email}
            </label>
          ))}
      </div>
    </>
  );
}
