import type { ReactNode } from "react";
// Imported directly rather than from the ui barrel, which tests often mock.
import { SortableList } from "../../../components/ui/SortableList";
import { repackDay, type RehearsalTimes } from "../utils/reorderUtils";

interface SortableRehearsalListProps<T extends RehearsalTimes> {
  // One day's rehearsals, sorted by start time.
  rehearsals: T[];
  breakMinutes: number;
  enabled: boolean;
  onReschedule: (times: RehearsalTimes[]) => void;
  renderItem: (rehearsal: T) => ReactNode;
}

export function SortableRehearsalList<T extends RehearsalTimes>({
  rehearsals,
  breakMinutes,
  enabled,
  onReschedule,
  renderItem,
}: SortableRehearsalListProps<T>) {
  return (
    <SortableList
      items={rehearsals}
      getId={(r) => r.id}
      enabled={enabled}
      rowId={(r) => `rehearsal-${r.id}`}
      handleLabel="Drag to reorder rehearsal"
      renderItem={renderItem}
      onMove={(from, to) => {
        const changed = repackDay(rehearsals, from, to, breakMinutes);
        if (changed.length > 0) onReschedule(changed);
      }}
    />
  );
}
