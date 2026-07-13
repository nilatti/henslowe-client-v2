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
  productionSpaceConflictsQueryOptions,
  usePublishRehearsalCalendar,
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
import { Button, Card, ConfirmDialog } from "../../../components/ui";
import { useConfirmDelete } from "../../../hooks/useConfirmDelete";
import type { RehearsalUser, RehearsalWithDetails } from "../types/rehearsal";
import { buildUserName } from "../../../utils/actorUtils";

function tsvEscape(val: string): string {
  return val.replace(/\t/g, " ").replace(/\n/g, " ");
}

function downloadRehearsalTSV(rehearsals: RehearsalWithDetails[]) {
  const headers = ["Date", "Start Time", "End Time", "Location", "Title", "Notes", "Content", "Call List"];

  const sorted = [...rehearsals].sort((a, b) => a.start_time.localeCompare(b.start_time));

  const rows = sorted.map((r) => {
    const date = format(parseISO(r.start_time), "yyyy-MM-dd");
    const startTime = format(parseISO(r.start_time), "h:mm a");
    const endTime = format(parseISO(r.end_time), "h:mm a");
    const location = r.space?.name ?? "";
    const title = r.title ?? "";
    const notes = r.notes ?? "";
    const withPages = (name: string, item: { start_page?: number | null; end_page?: number | null }) => {
      if (!name || item.start_page == null || item.end_page == null) return name;
      return item.start_page === item.end_page
        ? `${name} (p. ${item.start_page})`
        : `${name} (pp. ${item.start_page}–${item.end_page})`;
    };
    const content = [
      ...r.acts.map((a) => withPages(a.heading ?? "", a)),
      ...r.scenes.map((s) => withPages(s.pretty_name ?? "", s)),
      ...r.french_scenes.map((fs) => withPages(fs.pretty_name ?? "", fs)),
    ].filter(Boolean).join(", ");
    const callList = r.users.map((u) => buildUserName(u)).join(", ");
    return [date, startTime, endTime, location, title, notes, content, callList];
  });

  const lines = [
    headers.map(tsvEscape).join("\t"),
    ...rows.map((row) => row.map(tsvEscape).join("\t")),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/tab-separated-values" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rehearsal-schedule.tsv";
  a.click();
  URL.revokeObjectURL(url);
}

// Sunday → red, Monday → orange, Tuesday → yellow, Wednesday → green,
// Thursday → blue, Friday → indigo, Saturday → violet
const DAY_BORDER_CLASSES = [
  "border-l-4 border-l-red-500",
  "border-l-4 border-l-orange-500",
  "border-l-4 border-l-yellow-500",
  "border-l-4 border-l-green-500",
  "border-l-4 border-l-blue-500",
  "border-l-4 border-l-indigo-500",
  "border-l-4 border-l-violet-500",
];

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
  const { data: productionSpaceConflicts } = useSuspenseQuery(
    productionSpaceConflictsQueryOptions(productionId),
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
  const [addFormDate, setAddFormDate] = useState<string | null>(null);

  const publishCalendar = usePublishRehearsalCalendar(productionId);
  const {
    target: confirmingPublish,
    open: requestPublish,
    close: clearPublish,
  } = useConfirmDelete<boolean>();

  const currentWeekEnd = endOfWeek(currentWeekStart);

  const weekRehearsals = rehearsals.filter((r) =>
    isWithinInterval(parseISO(r.start_time), {
      start: currentWeekStart,
      end: currentWeekEnd,
    }),
  );

  const rehearsalsWithDate = weekRehearsals.map((r) => ({
    ...r,
    date: format(parseISO(r.start_time), "yyyy-MM-dd"),
  }));

  const groupedRehearsals = _.groupBy(rehearsalsWithDate, "date");

  const toRehearsalUser = (
    u: NonNullable<(typeof jobs)[number]["user"]>,
    jobTitle?: string | null,
  ): RehearsalUser => ({
    id: u.id,
    first_name: u.first_name ?? "",
    last_name: u.last_name ?? "",
    email: u.email ?? "",
    fake: u.fake,
    preferred_name: u.preferred_name ?? null,
    job_title: jobTitle ?? null,
  });

  const actors = getActors(jobs)
    .filter((u) => !u.fake)
    .map((u) => toRehearsalUser(u));

  const staffJobs = getStaffJobs(jobs).filter((j) => j.user && !j.user.fake);
  const staffTitlesByUserId = new Map<number, string[]>();
  staffJobs.forEach((j) => {
    if (!j.user || !j.specialization?.title) return;
    const existing = staffTitlesByUserId.get(j.user.id) ?? [];
    if (!existing.includes(j.specialization.title)) {
      staffTitlesByUserId.set(j.user.id, [...existing, j.specialization.title]);
    }
  });
  const productionStaff = _.uniqBy(
    staffJobs.map((j) =>
      toRehearsalUser(j.user!, staffTitlesByUserId.get(j.user!.id)?.join(", ")),
    ),
    "id",
  );

  const actorCharacterNames = new Map<number, string[]>();
  const castings = getCastings(jobs);
  castings.forEach((j) => {
    if (j.user && j.character) {
      const existing = actorCharacterNames.get(j.user.id) ?? [];
      actorCharacterNames.set(j.user.id, [...existing, j.character.name]);
    }
  });
  const seenGroups = new Map<number, Set<string>>();
  castings.forEach((j) => {
    if (!j.user || !j.character_group) return;
    const groups = seenGroups.get(j.user.id) ?? new Set<string>();
    if (!groups.has(j.character_group.name)) {
      groups.add(j.character_group.name);
      const existing = actorCharacterNames.get(j.user.id) ?? [];
      actorCharacterNames.set(j.user.id, [...existing, j.character_group.name]);
    }
    seenGroups.set(j.user.id, groups);
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
          <Button variant="secondary" onClick={() => requestPublish()}>
            Publish rehearsal calendar
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            Add Rehearsal
          </Button>
        </div>
      )}

      {confirmingPublish && (
        <ConfirmDialog
          message="This will email calendar invites to everyone on the call list for any new or changed rehearsals, and cancellations to anyone removed. Continue?"
          confirmLabel="Publish"
          pendingLabel="Publishing…"
          onConfirm={async () => {
            await publishCalendar.mutateAsync();
            clearPublish();
          }}
          onCancel={clearPublish}
        />
      )}

      {showPatternCreator && (
        <div className="mb-6">
          <RehearsalPatternCreator
            productionId={productionId}
            theaterId={theaterId}
            actors={actors}
            productionStaff={productionStaff}
            actorCharacterNames={actorCharacterNames}
            defaultSpaceId={productionSkeleton?.default_space_id}
            defaultCallUserIds={productionSkeleton?.default_call_user_ids}
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
        >
          ← Last week
        </Button>
        <span className="text-sm font-medium text-gray-700">{weekLabel}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => downloadRehearsalTSV(rehearsals)}
          >
            Download TSV
          </Button>
          <Button
            variant="secondary"
            onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
          >
            Next week →
          </Button>
        </div>
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
              <Card key={date} className={DAY_BORDER_CLASSES[parseISO(date).getDay()]}>
                <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {format(parseISO(date), "EEEE, MMMM d")}
                  </h3>
                </div>
                <div className="px-4 pb-2">
                  {[...groupedRehearsals[date]].sort((a, b) => a.start_time.localeCompare(b.start_time)).map((rehearsal) => (
                    <div key={rehearsal.id} id={`rehearsal-${rehearsal.id}`}>
                      <RehearsalShow
                        rehearsal={rehearsal}
                        productionId={productionId}
                        playId={playId}
                        theaterId={theaterId}
                        actors={actors}
                        productionStaff={productionStaff}
                        isAdmin={isAdmin}
                        productionUserConflicts={productionUserConflicts}
                        productionSpaceConflicts={productionSpaceConflicts}
                        actorCharacterNames={actorCharacterNames}
                      />
                    </div>
                  ))}
                  {isAdmin && addFormDate === date && (() => {
                    const sorted = [...groupedRehearsals[date]].sort((a, b) => a.start_time.localeCompare(b.start_time));
                    const last = sorted[sorted.length - 1];
                    return (
                      <div className="pt-2 border-t border-gray-100 mt-2">
                        <RehearsalForm
                          productionId={productionId}
                          theaterId={theaterId}
                          defaultSpaceId={productionSkeleton?.default_space_id}
                          defaultStartTime={last.end_time}
                          defaultEndTime={last.end_time}
                          onSuccess={() => setAddFormDate(null)}
                          onCancel={() => setAddFormDate(null)}
                        />
                      </div>
                    );
                  })()}
                  {isAdmin && addFormDate !== date && (
                    <div className="pt-2 mt-1">
                      <Button
                        variant="secondary"
                        onClick={() => setAddFormDate(date)}
                      >
                        + Add rehearsal
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
