import { useState } from "react";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { productionSkeletonQueryOptions } from "../api/productions";
import { productionJobsQueryOptions } from "../../jobs/api/jobs";
import { playScriptQueryOptions } from "../../script/api/script";
import { getActors } from "../../jobs/utils/jobUtils";
import { buildUserName } from "../../../utils/actorUtils";
import { ACTOR_SPECIALIZATION_ID } from "../../../utils/constants";
import { DoublingChartShow } from "./DoublingChartShow";
import type { ChartPlay } from "./DoublingChartShow";
import { Tabs } from "../../../components/ui";

interface DoublingChartContainerProps {
  productionId: number;
}

const TABS = [
  { id: "act", label: "Acts" },
  { id: "scene", label: "Scenes" },
  { id: "french_scene", label: "French Scenes" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function DoublingChartContainer({
  productionId,
}: DoublingChartContainerProps) {
  const [activeTab, setActiveTab] = useState<TabId>("act");

  const { data: production } = useSuspenseQuery(
    productionSkeletonQueryOptions(productionId),
  );
  const { data: jobs } = useSuspenseQuery(
    productionJobsQueryOptions(productionId),
  );
  const playId = production.play?.id;
  const { data: script } = useQuery({
    ...playScriptQueryOptions(playId ?? 0),
    enabled: !!playId,
  });

  const actors = getActors(jobs);
  const castings = jobs.filter(
    (j) =>
      j.specialization_id === ACTOR_SPECIALIZATION_ID &&
      (j.character_id != null || j.character_group_id != null),
  );

  const chartPlay: ChartPlay | null =
    script && script.acts.length > 0
      ? {
          id: production.play.id,
          title: production.play.title,
          acts: script.acts as unknown as ChartPlay["acts"],
        }
      : null;

  return (
    <div className="space-y-6">
      <div>
        {chartPlay && (
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Doubling Charts for{" "}
            <Link
              to="/productions/$productionId"
              params={{ productionId: String(productionId) }}
              className="text-blue-600 hover:text-blue-800"
            >
              {chartPlay.title}
            </Link>
          </h2>
        )}

        <p className="text-sm text-gray-600 mb-3">
          Orange indicates one actor playing two characters in an
          act/scene/french scene. A character name in parenthesis indicates that
          the character is onstage but (in your cut) doesn't talk.
        </p>

        {actors.some((actor) => castings.some((c) => c.user_id === actor.id)) && (
          <ul className="mb-4 list-disc list-inside text-sm">
            {actors
              .filter((actor) => castings.some((c) => c.user_id === actor.id))
              .map((actor) => {
                const actorCastings = castings.filter(
                  (c) => c.user_id === actor.id,
                );
                const actorLineCount = actorCastings.reduce(
                  (sum, c) =>
                    sum + (c.character?.new_line_count ?? c.character?.original_line_count ?? 0),
                  0,
                );
                return (
                  <li key={actor.id}>
                    {actor.fake ? (
                      <span>{buildUserName(actor)}</span>
                    ) : (
                      <Link
                        to="/users/$userId"
                        params={{ userId: String(actor.id) }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {buildUserName(actor)}
                      </Link>
                    )}
                    {actorLineCount > 0 && (
                      <span className="text-xs text-gray-400 ml-1">
                        ({actorLineCount} lines)
                      </span>
                    )}
                    <ul className="list-disc list-inside ml-4">
                      {[...actorCastings]
                        .sort((a, b) => {
                          const typeA = a.character_id != null ? 0 : 1;
                          const typeB = b.character_id != null ? 0 : 1;
                          if (typeA !== typeB) return typeA - typeB;
                          const nameA = a.character?.name ?? a.character_group?.name ?? "";
                          const nameB = b.character?.name ?? b.character_group?.name ?? "";
                          return nameA.localeCompare(nameB);
                        })
                        .map((casting) => {
                        const charName =
                          casting.character?.name ??
                          casting.character_group?.name;
                        const charId = casting.character_id;
                        const groupId = casting.character_group_id;
                        const lineCount =
                          casting.character?.new_line_count ?? casting.character?.original_line_count;
                        return (
                          <li key={casting.id}>
                            {charId && playId ? (
                              <Link
                                to="/plays/$playId/characters/$characterId"
                                params={{
                                  playId: String(playId),
                                  characterId: String(charId),
                                }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                {charName}
                              </Link>
                            ) : groupId && playId ? (
                              <Link
                                to="/plays/$playId/characters/$characterId"
                                params={{
                                  playId: String(playId),
                                  characterId: String(groupId),
                                }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                {charName}
                              </Link>
                            ) : (
                              charName
                            )}
                            {lineCount != null && lineCount > 0 && (
                              <span className="text-xs text-gray-400 ml-1">
                                ({lineCount} lines)
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
          </ul>
        )}

        <Tabs
          tabs={[...TABS]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as TabId)}
        />

        {chartPlay ? (
          <DoublingChartShow
            level={activeTab}
            play={chartPlay}
            castings={castings}
            actors={actors}
          />
        ) : (
          <p className="text-sm text-gray-500 py-4">
            No casting data available yet.
          </p>
        )}
      </div>
    </div>
  );
}
