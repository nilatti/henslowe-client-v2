import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { productionJobsQueryOptions } from "../api/jobs";
import { playSkeletonQueryOptions } from "../../plays/api/plays";
import { CastingRow } from "./CastingRow";
import { CharacterGroupCastingSection } from "./CharacterGroupCastingSection";
import { AuditionersList } from "./AuditionersList";
import { StaffJobsList } from "./StaffJobsList";
import { FakeActorsPanel } from "./FakeActorsPanel";
import { CastingReassign } from "./CastingReassign";
import {
  useUserRoleForProduction,
  useIsSuperAdmin,
} from "../../../hooks/useUserRole";
import { Button, Card } from "../../../components/ui";
import {
  getCastings,
  getStaffJobs,
  getActorsAndAuditioners,
  getAuditioners,
} from "../utils/jobUtils";

interface CastListProps {
  productionId: number;
  theaterId: number;
  playId: number;
  productionStartDate: string | null;
  productionEndDate: string | null;
}

export function ProductionJobs({
  productionId,
  theaterId,
  playId,
  productionStartDate,
  productionEndDate,
}: CastListProps) {
  const invalidateKey = ["jobs", { productionId }];
  const { data: jobs } = useSuspenseQuery(
    productionJobsQueryOptions(productionId),
  );
  const { data: playSkeleton } = useSuspenseQuery(
    playSkeletonQueryOptions(playId),
  );
  const role = useUserRoleForProduction(productionId, theaterId);
  const isSuperAdmin = useIsSuperAdmin();
  const isAdmin = role === "admin" || isSuperAdmin;

  const [showFakeActors, setShowFakeActors] = useState(false);
  const [showReassign, setShowReassign] = useState(false);

  const castings = getCastings(jobs);
  const staffJobs = getStaffJobs(jobs);
  const actorsAndAuditioners = getActorsAndAuditioners(jobs);
  const auditioners = getAuditioners(jobs);
  const characterGroups = playSkeleton.character_groups ?? [];

  return (
    <div className="space-y-8">
      {/* Cast list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-gray-900">
            Cast ({castings.length})
          </h2>
          {isAdmin && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowFakeActors(!showFakeActors)}
              >
                Placeholder actors
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowReassign(!showReassign)}
              >
                Reassign track
              </Button>
            </div>
          )}
        </div>

        {showFakeActors && (
          <div className="mb-4">
            <FakeActorsPanel
              jobs={jobs}
              productionId={productionId}
              theaterId={theaterId}
              invalidateKey={invalidateKey}
            />
          </div>
        )}

        {showReassign && (
          <div className="mb-4">
            <CastingReassign
              jobs={jobs}
              invalidateKey={invalidateKey}
              onClose={() => setShowReassign(false)}
            />
          </div>
        )}

        <Card>
          {castings.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">
              No casting yet. Add auditioners first, then cast from the list
              below.
            </p>
          ) : (
            <ul>
              {castings.map((casting) => (
                <CastingRow
                  key={casting.id}
                  casting={casting}
                  actorsAndAuditioners={actorsAndAuditioners}
                  isAdmin={isAdmin}
                  invalidateKey={invalidateKey}
                />
              ))}
            </ul>
          )}
        </Card>

        <CharacterGroupCastingSection
          characterGroups={characterGroups}
          jobs={jobs}
          auditioners={auditioners}
          isAdmin={isAdmin}
          invalidateKey={invalidateKey}
          productionId={productionId}
          productionStartDate={productionStartDate}
          productionEndDate={productionEndDate}
        />
      </div>

      {/* Auditioners */}
      <AuditionersList
        jobs={jobs}
        productionId={productionId}
        theaterId={theaterId}
        productionStartDate={productionStartDate}
        productionEndDate={productionEndDate}
        isAdmin={isAdmin}
        invalidateKey={invalidateKey}
      />

      {/* Production staff */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-3">
          Production Staff ({staffJobs.length})
        </h2>
        <StaffJobsList
          jobs={staffJobs}
          productionId={productionId}
          theaterId={theaterId}
          isAdmin={isAdmin}
          invalidateKey={invalidateKey}
        />
      </div>
    </div>
  );
}
