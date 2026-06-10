import { parseISO } from "date-fns";
import type { Conflict } from "../types/conflict";
import type { ProductionUserConflict } from "../../rehearsals/api/rehearsals";
import type { RehearsalUser } from "../../rehearsals/types/rehearsal";

export const userConflictsMap = (
  productionUserConflicts: ProductionUserConflict[],
) => {
  const map = new Map<number, Conflict[]>();
  for (const { user, conflicts } of productionUserConflicts) {
    const existing = map.get(user.id);
    if (!existing || conflicts.length > existing.length) {
      map.set(user.id, conflicts);
    }
  }
  return map;
};
export const getConflictedUserIds = (
  users: RehearsalUser[],
  productionUserConflicts: ProductionUserConflict[],
  rehearsalStartDate: Date,
  rehearsalEndDate: Date,
) => {
  const conflictedUserIds = new Set<number>();
  const conflictsByUserId = userConflictsMap(productionUserConflicts);

  users.forEach((u) => {
    const conflicts = conflictsByUserId.get(u.id) ?? [];
    for (const c of conflicts) {
      if (parseISO(c.start_time) < rehearsalEndDate && parseISO(c.end_time) > rehearsalStartDate) {
        conflictedUserIds.add(u.id);
        break;
      }
    }
  });

  return conflictedUserIds;
};

export const getConflictsForUserForRehearsal = (
  userId: number,
  productionUserConflicts: ProductionUserConflict[],
  rehearsalStartDate: Date,
  rehearsalEndDate: Date,
) => {
  const conflictsByUserId = userConflictsMap(productionUserConflicts);
  const conflicts = conflictsByUserId.get(userId) ?? [];

  return conflicts.filter((c) => {
    const cStart = parseISO(c.start_time);
    const cEnd = parseISO(c.end_time);
    return cStart < rehearsalEndDate && cEnd > rehearsalStartDate;
  });
};
