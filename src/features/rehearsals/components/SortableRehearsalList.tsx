import type { ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  const sensors = useSensors(
    // A small drag distance keeps plain clicks on the handle from starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!enabled) {
    return (
      <>
        {rehearsals.map((r) => (
          <div key={r.id} id={`rehearsal-${r.id}`}>
            {renderItem(r)}
          </div>
        ))}
      </>
    );
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = rehearsals.findIndex((r) => r.id === active.id);
    const to = rehearsals.findIndex((r) => r.id === over.id);
    if (from < 0 || to < 0) return;
    const changed = repackDay(rehearsals, from, to, breakMinutes);
    if (changed.length > 0) onReschedule(changed);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={rehearsals.map((r) => r.id)} strategy={verticalListSortingStrategy}>
        {rehearsals.map((r) => (
          <SortableRehearsal key={r.id} id={r.id}>
            {renderItem(r)}
          </SortableRehearsal>
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableRehearsal({ id, children }: { id: number; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      id={`rehearsal-${id}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`flex items-start gap-2 bg-white ${isDragging ? "relative z-10 shadow-lg opacity-90" : ""}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder rehearsal"
        title="Drag to reorder"
        className="mt-3 px-1 text-gray-400 hover:text-gray-700 cursor-grab active:cursor-grabbing touch-none select-none"
      >
        ⋮⋮
      </button>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
