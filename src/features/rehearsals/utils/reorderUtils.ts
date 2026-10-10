import { arrayMove } from "@dnd-kit/sortable";

export interface RehearsalTimes {
  id: number;
  start_time: string;
  end_time: string;
}

// Moves one rehearsal to a new position in a day and re-packs the day: the
// day still starts when its earliest rehearsal did, every rehearsal keeps its
// length, and each one starts `breakMinutes` after the previous one ends. Gaps
// close up and the day may run later than before. Returns only the rehearsals
// whose times changed.
export function repackDay(
  dayRehearsals: RehearsalTimes[],
  fromIndex: number,
  toIndex: number,
  breakMinutes: number,
): RehearsalTimes[] {
  if (dayRehearsals.length === 0) return [];
  const sorted = [...dayRehearsals].sort(
    (a, b) => Date.parse(a.start_time) - Date.parse(b.start_time),
  );
  const reordered = arrayMove(sorted, fromIndex, toIndex);

  let cursor = Date.parse(sorted[0].start_time);
  const changed: RehearsalTimes[] = [];
  reordered.forEach((r) => {
    const length = Date.parse(r.end_time) - Date.parse(r.start_time);
    const start = cursor;
    const end = start + length;
    if (start !== Date.parse(r.start_time) || end !== Date.parse(r.end_time)) {
      changed.push({
        id: r.id,
        start_time: new Date(start).toISOString(),
        end_time: new Date(end).toISOString(),
      });
    }
    cursor = end + breakMinutes * 60000;
  });
  return changed;
}
