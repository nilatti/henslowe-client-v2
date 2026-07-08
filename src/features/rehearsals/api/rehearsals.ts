import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import api from "../../../api/client";
import { customQueryOptions } from "../../../api/queryFactory";
import type { Rehearsal, RehearsalUser, RehearsalWithDetails } from "../types/rehearsal";
import type { Conflict } from "../../conflicts/types/conflict";

export interface ProductionUserConflict {
  user: { id: number; first_name: string; last_name: string };
  conflicts: Conflict[];
}

export interface ProductionSpaceConflict {
  space: { id: number; name: string };
  conflicts: Conflict[];
}

export interface TextUnitWithOnStages {
  id: number;
  number: number | string;
  pretty_name?: string;
  heading?: string | null;
  summary?: string | null;
  start_page?: number | null;
  end_page?: number | null;
  find_on_stages: {
    user_id: number | null;
    character_id: number | null;
    character_group_id: number | null;
  }[];
  rehearsals?: { id: number; start_time: string; end_time: string }[];
  isScheduled?: boolean;
  isRecommended?: boolean;
  reasonsForRecommendation?: {
    unavailableUsers: { id: number; first_name: string; last_name: string }[];
  };
  furtherInfo?: string;
}

export const playActOnStagesQueryOptions = (playId: number) =>
  customQueryOptions<TextUnitWithOnStages[]>(
    ["plays", playId, "act_on_stages"],
    `/api/v1/plays/${playId}/play_act_on_stages`,
  );

export const playSceneOnStagesQueryOptions = (playId: number) =>
  customQueryOptions<TextUnitWithOnStages[]>(
    ["plays", playId, "scene_on_stages"],
    `/api/v1/plays/${playId}/play_scene_on_stages`,
  );

export const playFrenchSceneOnStagesQueryOptions = (playId: number) =>
  customQueryOptions<TextUnitWithOnStages[]>(
    ["plays", playId, "french_scene_on_stages"],
    `/api/v1/plays/${playId}/play_french_scene_on_stages`,
  );

export const productionRehearsalsQueryOptions = (productionId: number) =>
  queryOptions({
    queryKey: ["rehearsals", { productionId }],
    queryFn: (): Promise<RehearsalWithDetails[]> =>
      api
        .get(`/api/v1/productions/${productionId}/rehearsals`)
        .then((r) => r.data),
  });

export const productionUserConflictsQueryOptions = (productionId: number) =>
  queryOptions({
    queryKey: ["productions", productionId, "user_conflicts"],
    queryFn: (): Promise<ProductionUserConflict[]> =>
      api
        .get(`/api/v1/productions/${productionId}/user_conflicts`)
        .then((r) => r.data),
    staleTime: 0,
  });

export const productionSpaceConflictsQueryOptions = (productionId: number) =>
  queryOptions({
    queryKey: ["productions", productionId, "space_conflicts"],
    queryFn: (): Promise<ProductionSpaceConflict[]> =>
      api
        .get(`/api/v1/productions/${productionId}/space_conflicts`)
        .then((r) => r.data),
    staleTime: 0,
  });

type UpdateRehearsalPayload = Partial<Rehearsal> & {
  id: number;
  user_ids?: number[];
  act_ids?: number[];
  scene_ids?: number[];
  french_scene_ids?: number[];
};

export function useCreateRehearsal(productionId: number) {
  const qc = useQueryClient();
  const key = ["rehearsals", { productionId }] as const;
  return useMutation({
    mutationFn: (data: Partial<Rehearsal>) =>
      api
        .post(`/api/v1/productions/${productionId}/rehearsals`, {
          rehearsal: data,
        })
        .then((r) => r.data as RehearsalWithDetails),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<RehearsalWithDetails[]>(key);
      const existing = previous ?? [];
      const space = data.space_id
        ? existing.find((r) => r.space?.id === data.space_id)?.space ?? null
        : null;
      const optimistic: RehearsalWithDetails = {
        id: -Date.now(),
        production_id: productionId,
        space_id: data.space_id ?? null,
        space,
        start_time: data.start_time ?? "",
        end_time: data.end_time ?? "",
        title: data.title ?? null,
        notes: data.notes ?? null,
        text_unit: data.text_unit ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        users: [],
        acts: [],
        scenes: [],
        french_scenes: [],
      };
      qc.setQueryData<RehearsalWithDetails[]>(key, [...existing, optimistic]);
      return { previous };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(key, ctx.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });
}

export function useUpdateRehearsal(productionId: number) {
  const qc = useQueryClient();
  const key = ["rehearsals", { productionId }] as const;
  return useMutation({
    mutationFn: (data: UpdateRehearsalPayload) =>
      api
        .put(`/api/v1/rehearsals/${data.id}`, { rehearsal: data })
        .then((r) => r.data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<RehearsalWithDetails[]>(key);

      // Build a user lookup pool from all rehearsals currently in cache
      const userPool = new Map<number, RehearsalUser>();
      previous?.forEach((r) => r.users.forEach((u) => userPool.set(u.id, u)));

      qc.setQueryData<RehearsalWithDetails[]>(
        key,
        previous?.map((r) => {
          if (r.id !== data.id) return r;
          const updated: RehearsalWithDetails = { ...r };
          if (data.start_time !== undefined) updated.start_time = data.start_time;
          if (data.end_time !== undefined) updated.end_time = data.end_time;
          if ("title" in data) updated.title = data.title ?? null;
          if ("notes" in data) updated.notes = data.notes ?? null;
          if ("text_unit" in data) updated.text_unit = data.text_unit ?? null;
          if ("space_id" in data) {
            updated.space_id = data.space_id ?? null;
            updated.space = data.space_id
              ? previous?.find((pr) => pr.space?.id === data.space_id)?.space ?? null
              : null;
          }
          if (data.user_ids !== undefined) {
            updated.users = data.user_ids
              .map((id) => userPool.get(id))
              .filter((u): u is RehearsalUser => u !== undefined);
          }
          return updated;
        }) ?? [],
      );
      return { previous };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(key, ctx.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });
}

export function useDeleteRehearsal(productionId: number) {
  const qc = useQueryClient();
  const key = ["rehearsals", { productionId }] as const;
  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/api/v1/rehearsals/${id}`).then((r) => r.data),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<RehearsalWithDetails[]>(key);
      qc.setQueryData<RehearsalWithDetails[]>(
        key,
        previous?.filter((r) => r.id !== id) ?? [],
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(key, ctx.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });
}

export function useBuildRehearsalSchedule(productionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pattern: object) =>
      api
        .put(`/api/v1/productions/${productionId}/build_rehearsal_schedule`, {
          production: { rehearsal_schedule_pattern: pattern },
        })
        .then((r) => r.data),
    onSuccess: () => {
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["rehearsals", { productionId }] });
      }, 5000);
    },
  });
}
