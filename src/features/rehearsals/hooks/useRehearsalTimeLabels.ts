import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  playActOnStagesQueryOptions,
  playSceneOnStagesQueryOptions,
  playFrenchSceneOnStagesQueryOptions,
} from "../api/rehearsals";
import { inheritedRehearsalTimeLabels } from "../utils/contentUtils";

// Rehearsal time per page labels for a play's acts, scenes and french scenes,
// keyed by id. Every level needs all three collections, since time is credited
// both up and down the act → scene → french scene tree.
export function useRehearsalTimeLabels(playId: number) {
  const { data: acts } = useQuery(playActOnStagesQueryOptions(playId));
  const { data: scenes } = useQuery(playSceneOnStagesQueryOptions(playId));
  const { data: frenchScenes } = useQuery(playFrenchSceneOnStagesQueryOptions(playId));
  return useMemo(
    () => inheritedRehearsalTimeLabels({ acts, scenes, frenchScenes }),
    [acts, scenes, frenchScenes],
  );
}
