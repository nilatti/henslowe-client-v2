import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { queryClient } from "../../../lib/queryClient";
import { playScriptQueryOptions } from "../../script/api/script";
import { playSkeletonQueryOptions } from "../../plays/api/plays";
import {
  getFrenchScenesFromPlay,
  getScenesFromPlay,
} from "../../../utils/playScriptUtils";
import type {
  PlayScript,
  ScriptAct,
  ScriptScene,
  ScriptFrenchScene,
  ScriptLine,
} from "../../script/types/script";
import type { PlaySkeleton } from "../../plays/types/play";
import type {
  FakeActor,
  FakeActorCounts,
  FreeCasting,
} from "../types/freePlay";

interface FreePlayState {
  play: PlayScript | null;
  playSkeleton: PlaySkeleton | null;
  castings: FreeCasting[];
  fakeActors: FakeActorCounts;
  fakeActorsArray: FakeActor[];
  loading: boolean;
}

interface FreePlayActions {
  getPlay: (playId: number) => Promise<void>;
  setPlay: (play: PlayScript | null) => void;
  setFakeActors: (counts: FakeActorCounts) => void;
  updateActorJobs: (actor: FakeActor, job: FreeCasting) => void;
  updateCastings: (casting: FreeCasting, actor: FakeActor) => void;
  updateLine: (line: ScriptLine) => void;
  getSelectedText: (textMenuKey: string, textUnit: string) => object;
}

export type FreePlayStore = FreePlayState & FreePlayActions;

function buildFakeActor(id: number, gender: string, i: number): FakeActor {
  return {
    id,
    email: "",
    first_name: gender.toUpperCase(),
    last_name: String(i + 1),
    fake: true,
    jobs: [],
  };
}

function buildCastings(
  characters: {
    id: number;
    name: string;
    new_line_count?: number | null;
    original_line_count?: number | null;
  }[],
): FreeCasting[] {
  return characters.map((character) => ({
    character_id: character.id,
    character,
  }));
}

function rebuildActorsArray(
  fakeActors: FakeActorCounts,
  existingArray: FakeActor[],
  castings: FreeCasting[],
): { actors: FakeActor[]; castings: FreeCasting[] } {
  const genders = ["female", "male", "nonbinary"] as const;

  if (!existingArray.length) {
    let id = 0;
    const actorsList: Record<string, FakeActor[]> = {
      female: [],
      male: [],
      nonbinary: [],
    };
    genders.forEach((gender) => {
      for (let i = 0; i < fakeActors[gender]; i++) {
        id++;
        actorsList[gender].push(buildFakeActor(id, gender, i));
      }
    });
    const actors = [
      ...actorsList.female,
      ...actorsList.male,
      ...actorsList.nonbinary,
    ];
    return { actors, castings };
  }

  const tempActorsList: Record<string, FakeActor[]> = {
    female: [],
    male: [],
    nonbinary: [],
  };
  existingArray.forEach((actor) => {
    const key = actor.first_name.toLowerCase();
    if (key in tempActorsList) tempActorsList[key].push(actor);
  });

  let updatedCastings = [...castings];
  let nextId = existingArray.reduce((max, a) => Math.max(max, a.id), 0);

  genders.forEach((gender) => {
    const diff = fakeActors[gender] - tempActorsList[gender].length;
    if (diff > 0) {
      const startIndex = tempActorsList[gender].length;
      for (let j = 0; j < diff; j++) {
        nextId++;
        tempActorsList[gender].push(
          buildFakeActor(nextId, gender, startIndex + j),
        );
      }
    } else if (diff < 0) {
      const removedActors = tempActorsList[gender].slice(fakeActors[gender]);
      tempActorsList[gender].length = fakeActors[gender];
      removedActors.forEach((actor) => {
        updatedCastings = updatedCastings.map((c) => {
          if (c.user && c.user.id === actor.id) {
            const { user, user_id, ...rest } = c;
            void user;
            void user_id;
            return rest;
          }
          return c;
        });
      });
    }
  });

  const actors = [
    ...tempActorsList.female,
    ...tempActorsList.male,
    ...tempActorsList.nonbinary,
  ];
  return { actors, castings: updatedCastings };
}

export const useFreePlayStore = create<FreePlayStore>()(
  persist(
    (set, get) => ({
      play: null,
      playSkeleton: null,
      castings: [],
      fakeActors: { female: 0, male: 0, nonbinary: 0 },
      fakeActorsArray: [],
      loading: false,

      getPlay: async (playId: number) => {
        sessionStorage.clear();
        set({ loading: true });
        try {
          const qc = queryClient;
          const [script, skeleton] = await Promise.all([
            qc.fetchQuery(playScriptQueryOptions(playId)),
            qc.fetchQuery(playSkeletonQueryOptions(playId)),
          ]);
          const play = { ...script, full: true, free: true } as PlayScript & {
            full: boolean;
            free: boolean;
          };
          const castings = buildCastings(
            (script.characters ?? []) as {
              id: number;
              name: string;
              new_line_count?: number | null;
              original_line_count?: number | null;
            }[],
          );
          set({
            play,
            playSkeleton: skeleton,
            castings,
            fakeActors: { female: 0, male: 0, nonbinary: 0 },
            fakeActorsArray: [],
          });
        } catch (e) {
          console.error("Error fetching play", e);
        } finally {
          set({ loading: false });
        }
      },

      setPlay: (play: PlayScript | null) => set({ play }),

      setFakeActors: (counts: FakeActorCounts) => {
        const { fakeActorsArray, castings } = get();
        const { actors, castings: updatedCastings } = rebuildActorsArray(
          counts,
          fakeActorsArray,
          castings,
        );
        set({
          fakeActors: counts,
          fakeActorsArray: actors,
          castings: updatedCastings,
        });
      },

      updateActorJobs: (actor: FakeActor, job: FreeCasting) => {
        const { fakeActorsArray } = get();
        const newActor = { ...actor, jobs: [...actor.jobs, job] };
        const newArray = fakeActorsArray.map((a) =>
          a.id === actor.id ? newActor : a,
        );
        set({ fakeActorsArray: newArray });
      },

      updateCastings: (casting: FreeCasting, actor: FakeActor) => {
        const { castings } = get();
        const updated = castings.map((c) =>
          c.character.id !== casting.character.id
            ? c
            : { ...c, user: actor, user_id: actor.id },
        );
        set({ castings: updated });
      },

      updateLine: (line: ScriptLine) => {
        const { play } = get();
        if (!play) return;
        const newLine = { ...line };
        delete (newLine as Record<string, unknown>).diffed_content;

        const frenchSceneId = newLine.french_scene_id;
        const fieldKey = "lines" as const;

        const newActs = play.acts.map((a: ScriptAct) => ({
          ...a,
          scenes: a.scenes.map((s: ScriptScene) => {
            const targetFs = s.french_scenes.find(
              (fs: ScriptFrenchScene) => fs.id === frenchSceneId,
            );
            if (!targetFs) return s;
            const updatedLines = (targetFs[fieldKey] as ScriptLine[]).map(
              (l) => (l.id !== newLine.id ? l : newLine),
            );
            const updatedFs = { ...targetFs, [fieldKey]: updatedLines };
            return {
              ...s,
              french_scenes: s.french_scenes.map((fs: ScriptFrenchScene) =>
                fs.id !== frenchSceneId ? fs : updatedFs,
              ),
            };
          }),
        }));

        set({ play: { ...play, acts: newActs } as PlayScript });
      },

      getSelectedText: (textMenuKey: string, textUnit: string) => {
        const { play } = get();
        if (!play) return { textUnit };

        type AnyRecord = Record<string, unknown>;
        const acts = play.acts;
        const scenes = getScenesFromPlay(
          play as unknown as Parameters<typeof getScenesFromPlay>[0],
        ) as unknown as AnyRecord[];
        const frenchScenes = getFrenchScenesFromPlay(
          play as unknown as Parameters<typeof getFrenchScenesFromPlay>[0],
        ) as unknown as AnyRecord[];

        let response: object = {};
        if (textUnit === "play") {
          response = play;
        } else if (textUnit === "act") {
          response = acts.find((a) => String(a.id) === textMenuKey) ?? {};
        } else if (textUnit === "scene") {
          const textUnitId = textMenuKey.match(/\/(\d+)/)?.[1];
          response = (scenes.find((s) => String(s.id) === textUnitId) ??
            {}) as object;
        } else if (textUnit === "frenchScene") {
          const matches = textMenuKey.match(/\/(\d+)/g);
          const textUnitId = matches?.[1]?.replace("/", "");
          response = (frenchScenes.find((fs) => String(fs.id) === textUnitId) ??
            {}) as object;
        }
        return { ...response, textUnit };
      },
    }),
    {
      name: "free-play-store",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

// Selectors
export const selectActs = (s: FreePlayStore) => s.play?.acts ?? [];
export const selectScenes = (s: FreePlayStore) =>
  s.play
    ? getScenesFromPlay(
        s.play as unknown as Parameters<typeof getScenesFromPlay>[0],
      )
    : [];
export const selectFrenchScenes = (s: FreePlayStore) =>
  s.play
    ? getFrenchScenesFromPlay(
        s.play as unknown as Parameters<typeof getFrenchScenesFromPlay>[0],
      )
    : [];
export const selectCharacters = (s: FreePlayStore) => s.play?.characters ?? [];
export const selectCharacterGroups = (s: FreePlayStore) =>
  s.play?.character_groups ?? [];
export const selectCharactersAll = (s: FreePlayStore) => {
  if (!s.play) return [];
  return [
    ...(s.play.characters ?? []).map((c) => ({
      ...c,
      type: "character" as const,
    })),
    ...(s.play.character_groups ?? []).map((cg) => ({
      ...cg,
      type: "character_group" as const,
    })),
  ];
};
