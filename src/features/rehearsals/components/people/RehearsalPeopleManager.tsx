import { useState } from "react";
import {
  useUpdateRehearsal,
  type ProductionUserConflict,
} from "../../api/rehearsals";
import type {
  RehearsalWithDetails,
  RehearsalUser,
} from "../../types/rehearsal";
import { Button, Card } from "../../../../components/ui";
import RehearsalCallSelector from "./RehearsalCallSelector";

interface RehearsalPeopleManagerProps {
  rehearsal: RehearsalWithDetails;
  productionId: number;
  actors: RehearsalUser[];
  productionStaff: RehearsalUser[];
  setShowPeopleManager: (show: boolean) => void;
  productionUserConflicts: ProductionUserConflict[];
  actorCharacterNames?: Map<number, string[]>;
}

export function RehearsalPeopleManager({
  rehearsal,
  productionId,
  actors,
  productionStaff,
  setShowPeopleManager,
  productionUserConflicts,
  actorCharacterNames,
}: RehearsalPeopleManagerProps) {
  const update = useUpdateRehearsal(productionId);
  const [selectedIds, setSelectedIds] = useState<number[]>(
    rehearsal.users.map((u) => u.id),
  );

  const handleToggle = (userId: number) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSave = async () => {
    const payload: { id: number; user_ids: number[] } = {
      id: rehearsal.id,
      user_ids: selectedIds,
    };
    await update.mutateAsync(payload);
    setShowPeopleManager(false);
  };

  return (
    <Card className="p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">
        Edit call list
      </h4>
      <RehearsalCallSelector
        actors={actors}
        productionStaff={productionStaff}
        selectedIds={selectedIds}
        handleToggle={handleToggle}
        productionUserConflicts={productionUserConflicts}
        rehearsalStartDate={new Date(rehearsal.start_time)}
        rehearsalEndDate={new Date(rehearsal.end_time)}
        currentRehearsalId={rehearsal.id}
        actorCharacterNames={actorCharacterNames}
      />
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? "Saving..." : "Save"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setSelectedIds(rehearsal.users.map((u) => u.id));
            setShowPeopleManager(false);
          }}
        >
          Cancel
        </Button>
      </div>
    </Card>
  );
}
