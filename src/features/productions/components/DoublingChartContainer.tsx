import { useState } from "react";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { productionSkeletonQueryOptions } from "../api/productions";
import { productionJobsQueryOptions } from "../../jobs/api/jobs";
import { playScriptQueryOptions } from "../../script/api/script";
import { getCastings, getActors } from "../../jobs/utils/jobUtils";
import { DoublingChartShow } from "./DoublingChartShow";
import type { ChartPlay } from "./DoublingChartShow";
import { ProductionJobs } from "../../jobs/components/ProductionJobs";
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
  const castings = getCastings(jobs);

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
      <ProductionJobs
        productionId={productionId}
        theaterId={production.theater.id}
        productionStartDate={production.start_date}
        productionEndDate={production.end_date}
      />

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
