import { useState, useMemo } from "react";
import { parseISO } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useUpdateRehearsal } from "../../api/rehearsals";
import { productionJobsQueryOptions } from "../../../jobs/api/jobs";
import {
  playActOnStagesQueryOptions,
  playSceneOnStagesQueryOptions,
  playFrenchSceneOnStagesQueryOptions,
  type TextUnitWithOnStages,
  type ProductionUserConflict,
} from "../../api/rehearsals";
import type {
  RehearsalWithDetails,
  RehearsalUser,
} from "../../types/rehearsal";
import { TextUnitSelector } from "./TextUnitSelector";
import { PlayContentCheckboxes } from "./PlayContentCheckboxes";
import { ExtraUsersPanel } from "./ExtraUsersPanel";
import { Button, Card } from "../../../../components/ui";
import {
  markContentRecommended,
  buildCallList,
  getCalledActors,
  detectExtraUsers,
  buildFinalUserIds,
} from "../../utils/contentUtils";
import { getConflictedUserIds } from "../../../conflicts/utils/conflictUtils";

interface RehearsalContentManagerProps {
  rehearsal: RehearsalWithDetails;
  productionId: number;
  playId: number;
  actors: RehearsalUser[];
  productionStaff: RehearsalUser[];
  onClose: () => void;
  productionUserConflicts: ProductionUserConflict[];
}

export function RehearsalContentManager({
  rehearsal,
  productionId,
  playId,
  actors,
  productionStaff,
  onClose,
  productionUserConflicts,
}: RehearsalContentManagerProps) {
  const updateRehearsal = useUpdateRehearsal(productionId);
  const { data: jobs } = useQuery(productionJobsQueryOptions(productionId));

  const characterToUserMap = useMemo(() => {
    if (!jobs) return new Map<number, number>();
    return new Map(
      jobs
        .filter((j) => j.character_id != null && j.user_id != null)
        .map((j) => [j.character_id!, j.user_id!])
    );
  }, [jobs]);

  const actsQuery = useQuery({
    ...playActOnStagesQueryOptions(playId),
    enabled: rehearsal.text_unit === "acts",
  });
  const scenesQuery = useQuery({
    ...playSceneOnStagesQueryOptions(playId),
    enabled: rehearsal.text_unit === "scenes",
  });
  const frenchScenesQuery = useQuery({
    ...playFrenchSceneOnStagesQueryOptions(playId),
    enabled: rehearsal.text_unit === "french_scenes",
  });

  const rawPlayContent =
    rehearsal.text_unit === "acts"
      ? actsQuery.data
      : rehearsal.text_unit === "scenes"
        ? scenesQuery.data
        : frenchScenesQuery.data;

  const isLoading =
    rehearsal.text_unit === "acts"
      ? actsQuery.isLoading
      : rehearsal.text_unit === "scenes"
        ? scenesQuery.isLoading
        : frenchScenesQuery.isLoading;

  const [selectedIds, setSelectedIds] = useState<number[]>(() => {
    const textUnit = (rehearsal.text_unit ??
      "acts") as keyof RehearsalWithDetails;
    const content = rehearsal[textUnit] as { id: number }[] | undefined;
    return content?.map((item) => item.id) ?? [];
  });
  const [extraUsers, setExtraUsers] = useState<RehearsalUser[]>([]);
  const [showExtraUsers, setShowExtraUsers] = useState(false);

  const rehearsalStartDate = parseISO(rehearsal.start_time);
  const rehearsalEndDate = parseISO(rehearsal.end_time);
  const conflictedIds = getConflictedUserIds(
    actors,
    productionUserConflicts,
    rehearsalStartDate,
    rehearsalEndDate,
    rehearsal.id,
  );
  const unavailableActors = actors.filter((a) => conflictedIds.has(a.id));

  const playContent = useMemo(() => {
    if (!rawPlayContent) return [];

    let processed: TextUnitWithOnStages[] = rawPlayContent.map((item) => ({
      ...item,
      heading: item.pretty_name ?? `Act ${item.number}`,
    }));
    processed = markContentRecommended(processed, unavailableActors, characterToUserMap);
    processed = processed.map((item) => ({
      ...item,
      furtherInfo: buildCallList(item, actors, characterToUserMap),
      isScheduled: selectedIds.includes(item.id),
    }));

    return processed;
  }, [rawPlayContent, unavailableActors, actors, selectedIds]);

  const handleToggle = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleReset = () => {
    updateRehearsal.mutate({
      id: rehearsal.id,
      text_unit: null,
      act_ids: [],
      scene_ids: [],
      french_scene_ids: [],
    } as Parameters<typeof updateRehearsal.mutateAsync>[0]);
  };

  const handleSchedule = () => {
    const selected = playContent.filter((item) => item.isScheduled);
    const newCalledActors = getCalledActors(selected, actors, characterToUserMap);

    const rehearsalActors = rehearsal.users.filter((u) =>
      actors.some((a) => a.id === u.id),
    );
    const extras = detectExtraUsers(rehearsalActors, newCalledActors);

    if (extras.length > 0) {
      setExtraUsers(extras);
      setShowExtraUsers(true);
    } else {
      submitContent([]);
    }
  };

  const submitContent = (confirmedExtraUsers: RehearsalUser[]) => {
    const selected = playContent.filter((item) => item.isScheduled);
    const calledActors = getCalledActors(selected, actors, characterToUserMap);
    const calledStaff = productionStaff.filter((s) =>
      rehearsal.users.some((u) => u.id === s.id),
    );
    const userIds = buildFinalUserIds(calledActors, confirmedExtraUsers, calledStaff);

    const singularKey = rehearsal.text_unit
      ? `${rehearsal.text_unit.slice(0, -1)}_ids`
      : "act_ids";

    const payload: Record<string, unknown> = {
      id: rehearsal.id,
      text_unit: rehearsal.text_unit,
      user_ids: userIds,
      [singularKey]: selected.map((item) => item.id),
    };

    updateRehearsal.mutate(
      payload as Parameters<typeof updateRehearsal.mutateAsync>[0],
    );
    onClose();
  };

  if (!rehearsal.text_unit) {
    return (
      <TextUnitSelector
        rehearsal={rehearsal}
        productionId={productionId}
        onClose={onClose}
      />
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6 text-center text-sm text-gray-500">
        Loading content...
      </Card>
    );
  }

  if (showExtraUsers && extraUsers.length > 0) {
    return (
      <ExtraUsersPanel
        extraUsers={extraUsers}
        onConfirm={(confirmed) => {
          setShowExtraUsers(false);
          submitContent(confirmed);
        }}
      />
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 capitalize">
          Select content ({rehearsal.text_unit.replace("_", " ")})
        </h3>
        <div className="flex gap-2">
          <Button onClick={handleSchedule} disabled={updateRehearsal.isPending}>
            {updateRehearsal.isPending ? "Saving..." : "Save content"}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleReset} disabled={updateRehearsal.isPending}>
            Reset
          </Button>
        </div>
      </div>
      {playContent.length === 0 ? (
        <p className="text-sm text-gray-400 italic">
          No content found for this play.
        </p>
      ) : (
        <PlayContentCheckboxes
          playContent={playContent}
          onChange={handleToggle}
        />
      )}
    </Card>
  );
}
