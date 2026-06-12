import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import _ from "lodash";
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  isWithinInterval,
} from "date-fns";
import {
  productionRehearsalsQueryOptions,
  productionUserConflictsQueryOptions,
} from "../api/rehearsals";
import { productionJobsQueryOptions } from "../../jobs/api/jobs";
import { productionSkeletonQueryOptions } from "../../productions/api/productions";
import { getActors, getStaffJobs, getCastings } from "../../jobs/utils/jobUtils";
import { RehearsalShow } from "./RehearsalShow";
import { RehearsalForm } from "./RehearsalForm";
import { RehearsalPatternCreator } from "./RehearsalPatternCreator";
import {
  useUserRoleForProduction,
  useIsSuperAdmin,
} from "../../../hooks/useUserRole";
import { Button, Card } from "../../../components/ui";
import type { RehearsalUser } from "../types/rehearsal";

interface RehearsalScheduleProps {
  productionId: number;
  playId: number;
  theaterId: number;
}

export function RehearsalSchedule({
  productionId,
  playId,
  theaterId,
}: RehearsalScheduleProps) {
  const { data: rehearsals } = useSuspenseQuery(
    productionRehearsalsQueryOptions(productionId),
  );
  const { data: jobs } = useSuspenseQuery(
    productionJobsQueryOptions(productionId),
  );
  const { data: productionUserConflicts } = useSuspenseQuery(
    productionUserConflictsQueryOptions(productionId),
  );
  const { data: productionSkeleton } = useSuspenseQuery(
    productionSkeletonQueryOptions(productionId),
  );
  const role = useUserRoleForProduction(productionId, theaterId);
  const isSuperAdmin = useIsSuperAdmin();
  const isAdmin = role === "admin" || isSuperAdmin;

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date()),
  );
  const [showForm, setShowForm] = useState(false);
  const [showPatternCreator, setShowPatternCreator] = useState(false);

  const currentWeekEnd = endOfWeek(currentWeekStart);

  const weekRehearsals = rehearsals.filter((r) =>
    isWithinInterval(parseISO(r.start_time), {
      start: currentWeekStart,
      end: currentWeekEnd,
    }),
  );

  const hasLastWeek = rehearsals.some((r) =>
    isWithinInterval(parseISO(r.start_time), {
      start: subWeeks(currentWeekStart, 1),
      end: subWeeks(currentWeekEnd, 1),
    }),
  );

  const hasNextWeek = rehearsals.some((r) =>
    isWithinInterval(parseISO(r.start_time), {
      start: addWeeks(currentWeekStart, 1),
      end: addWeeks(currentWeekEnd, 1),
    }),
  );

  const rehearsalsWithDate = weekRehearsals.map((r) => ({
    ...r,
    date: format(parseISO(r.start_time), "yyyy-MM-dd"),
  }));

  const groupedRehearsals = _.groupBy(rehearsalsWithDate, "date");

  const toRehearsalUser = (
    u: NonNullable<(typeof jobs)[number]["user"]>,
  ): RehearsalUser => ({
    id: u.id,
    first_name: u.first_name ?? "",
    last_name: u.last_name ?? "",
    email: u.email ?? "",
    fake: u.fake,
    preferred_name: u.preferred_name ?? null,
  });

  const actors = getActors(jobs)
    .filter((u) => !u.fake)
    .map(toRehearsalUser);
  const productionStaff = _.uniqBy(
    getStaffJobs(jobs)
      .filter((j) => j.user && !j.user.fake)
      .map((j) => toRehearsalUser(j.user!)),
    "id",
  );

  const actorCharacterNames = new Map<number, string[]>();
  getCastings(jobs).forEach((j) => {
    if (j.user && j.character) {
      const existing = actorCharacterNames.get(j.user.id) ?? [];
      actorCharacterNames.set(j.user.id, [...existing, j.character.name]);
    }
  });

  const weekLabel = `${format(currentWeekStart, "MMMM d")} – ${format(currentWeekEnd, "MMMM d, yyyy")}`;

  return (
    <div>
      {isAdmin && (
        <div className="flex justify-end gap-2 mb-6">
          <Button
            variant="secondary"
            onClick={() => setShowPatternCreator(!showPatternCreator)}
          >
            Pattern generator
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            Add Rehearsal
          </Button>
        </div>
      )}

      {showPatternCreator && (
        <div className="mb-6">
          <RehearsalPatternCreator
            productionId={productionId}
            actors={actors}
            productionStaff={productionStaff}
            actorCharacterNames={actorCharacterNames}
            onClose={() => setShowPatternCreator(false)}
          />
        </div>
      )}

      {showForm && (
        <Card className="p-6 mb-6">
          <RehearsalForm
            productionId={productionId}
            theaterId={theaterId}
            defaultSpaceId={productionSkeleton?.default_space_id}
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      <div className="flex items-center justify-between mb-4">
        <Button
          variant="secondary"
          onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
          disabled={!hasLastWeek}
        >
          ← Last week
        </Button>
        <span className="text-sm font-medium text-gray-700">{weekLabel}</span>
        <Button
          variant="secondary"
          onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
          disabled={!hasNextWeek}
        >
          Next week →
        </Button>
      </div>

      {Object.keys(groupedRehearsals).length === 0 ? (
        <Card className="p-6 text-center text-gray-500 text-sm">
          No rehearsals this week.
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.keys(groupedRehearsals)
            .sort()
            .map((date) => (
              <Card key={date}>
                <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {format(parseISO(date), "EEEE, MMMM d")}
                  </h3>
                </div>
                <div className="px-4 pb-2">
                  {groupedRehearsals[date].map((rehearsal) => (
                    <RehearsalShow
                      key={rehearsal.id}
                      rehearsal={rehearsal}
                      productionId={productionId}
                      playId={playId}
                      theaterId={theaterId}
                      actors={actors}
                      productionStaff={productionStaff}
                      isAdmin={isAdmin}
                      productionUserConflicts={productionUserConflicts}
                      actorCharacterNames={actorCharacterNames}
                    />
                  ))}
                </div>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
