import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useConfirmDelete } from "../../../hooks/useConfirmDelete";
import _ from "lodash";
import { useQuery } from "@tanstack/react-query";
import { useDeleteJob } from "../api/jobs";
import type { JobWithDetails } from "../types/job";
import { JobForm } from "./JobForm";
import { Button, Card, ConfirmDialog } from "../../../components/ui";
import { buildUserName } from "../../../utils/actorUtils";
import { specializationsQueryOptions } from "../../specializations/queries";

interface AuditionersListProps {
  jobs: JobWithDetails[];
  productionId: number;
  theaterId: number;
  productionStartDate: string | null;
  productionEndDate: string | null;
  isAdmin: boolean;
  invalidateKey: unknown[];
}

export function AuditionersList({
  jobs,
  productionId,
  theaterId,
  isAdmin,
  invalidateKey,
}: AuditionersListProps) {
  const deleteJob = useDeleteJob(invalidateKey);
  const { data: specializations = [] } = useQuery(specializationsQueryOptions());
  const auditionerSpecId = specializations.find(s => s.title === 'Auditioner')?.id;

  const [showAuditioners, setShowAuditioners] = useState(false);
  const [hideCast, setHideCast] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { target: confirmDelete, open: requestDelete, close: clearDelete } = useConfirmDelete<number>();

  const auditionerJobs = jobs.filter(
    (j) => j.specialization?.title === 'Auditioner',
  );
  const actorUserIds = new Set(
    jobs
      .filter((j) => j.specialization?.title === 'Actor' && j.user_id)
      .map((j) => j.user_id!),
  );

  const sortedAuditioners = _.sortBy(auditionerJobs, [
    "user.gender",
    "user.last_name",
  ]);
  const displayedAuditioners = hideCast
    ? sortedAuditioners.filter((j) => !actorUserIds.has(j.user_id!))
    : sortedAuditioners;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <Button
          variant="secondary"
          onClick={() => setShowAuditioners(!showAuditioners)}
        >
          {showAuditioners ? "Hide auditioners" : "Show auditioners"}
        </Button>
        <h3 className="text-sm font-semibold text-gray-900">
          Auditioners ({auditionerJobs.length})
        </h3>
        <Button variant="secondary" onClick={() => setHideCast(!hideCast)}>
          {hideCast ? "Show actors who are cast" : "Hide actors who are cast"}
        </Button>
      </div>
      {isAdmin && !showForm && (
        <Button className="mb-3" onClick={() => setShowForm(true)}>
          Add Auditioner
        </Button>
      )}

      <p className="text-xs text-amber-600 mb-3">
        Add auditioners before casting — you need a record of who auditioned.
      </p>

      {showForm && (
        <Card className="p-4 mb-4">
          <JobForm
            productionId={productionId}
            theaterId={theaterId}
            specializationId={auditionerSpecId}
            invalidateKey={invalidateKey}
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      <Card>
        <p className="px-4 pt-3 text-xs text-amber-600 italic">
          Placeholder actors shown in amber
        </p>
        {displayedAuditioners.length === 0 ? (
          <p className="px-4 py-3 text-sm text-gray-500">No auditioners yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {displayedAuditioners.map((job) => (
              <li
                key={job.id}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {job.user?.fake ? (
                    <span className="text-amber-600 italic">
                      {buildUserName(job.user)}
                    </span>
                  ) : (
                    <Link
                      to="/users/$userId"
                      params={{ userId: String(job.user_id) }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {job.user ? buildUserName(job.user) : "Unknown"}
                    </Link>
                  )}
                  {isAdmin && !job.user?.fake && (
                    <Link
                      to="/auditions/$jobId"
                      params={{ jobId: String(job.id) }}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      See audition materials
                    </Link>
                  )}
                </div>
                {isAdmin && (
                  <Button
                    variant="danger"
                    onClick={() => requestDelete(job.id)}
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {confirmDelete !== null && (
        <ConfirmDialog
          message="Remove this auditioner?"
          isDestructive
          confirmLabel="Remove"
          onConfirm={async () => {
            await deleteJob.mutateAsync(confirmDelete);
            clearDelete();
          }}
          onCancel={clearDelete}
        />
      )}
    </div>
  );
}
