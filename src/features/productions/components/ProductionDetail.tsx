import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useConfirmDelete } from "../../../hooks/useConfirmDelete";
import { Link, useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import {
  productionSkeletonQueryOptions,
  useDeleteProduction,
} from "../api/productions";
import { ProductionForm } from "./ProductionForm";
import { ProductionPhasesSection } from "./ProductionPhasesSection";
import { ProductionJobs } from "../../jobs/components/ProductionJobs";
import {
  useIsSuperAdmin,
  useUserRoleForProduction,
  useUserRoleForTheater,
} from "../../../hooks/useUserRole";
import {
  Button,
  Card,
  ConfirmDialog,
  InfoCard,
  PageHeader,
  Tabs,
} from "../../../components/ui";

interface ProductionDetailProps {
  productionId: number;
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  try {
    return format(parseISO(d), "MMM d, yyyy");
  } catch {
    return d;
  }
}

export function ProductionDetail({ productionId }: ProductionDetailProps) {
  const { data: production } = useSuspenseQuery(
    productionSkeletonQueryOptions(productionId),
  );
  const deleteProduction = useDeleteProduction();
  const isSuperAdmin = useIsSuperAdmin();
  const productionRole = useUserRoleForProduction(
    productionId,
    production.theater?.id ?? 0,
  );
  const theaterRole = useUserRoleForTheater(production.theater?.id ?? 0);
  const isAdmin = productionRole === "admin" || isSuperAdmin;
  const canDelete = theaterRole === "admin" || isSuperAdmin;
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("info");
  const [isEditing, setIsEditing] = useState(false);
  const { target: confirmDelete, open: requestDelete, close: clearDelete } = useConfirmDelete();

  const title = production.play?.title ?? "";

  const tabs = [
    { id: "info", label: "Info" },
    { id: "people", label: "People" },
    { id: "rehearsals", label: "Rehearsals" },
    { id: "doubling-charts", label: "Doubling Charts" },
    { id: "set-design", label: "Set Design" },
    { id: "script", label: "Script" },
  ];

  return (
    <div>
      <div className="mb-2 flex gap-2 text-sm">
        <Link to="/productions" className="text-blue-600 hover:text-blue-800">
          Productions
        </Link>
        <span className="text-gray-400">→</span>
        <span className="text-gray-600">{title}</span>
      </div>

      <PageHeader
        title={title}
        action={
          isAdmin ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              {canDelete && (
                <Button variant="danger" onClick={requestDelete}>
                  Delete
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      {isEditing ? (
        <Card className="p-6 mb-6">
          <ProductionForm
            production={production}
            onSuccess={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        </Card>
      ) : (
        <>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === "info" && (
            <InfoCard fields={[
              {
                label: 'Theater',
                value: (
                  <Link
                    to="/theaters/$theaterId"
                    params={{ theaterId: String(production.theater?.id ?? 0) }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {production.theater?.name}
                  </Link>
                ),
              },
              { label: 'Play', value: production.play?.title },
              (production.start_date || production.end_date) && {
                label: 'Dates',
                value: `${formatDate(production.start_date)}${production.end_date ? ` – ${formatDate(production.end_date)}` : ''}`,
              },
              production.lines_per_minute != null && { label: 'Lines per minute', value: production.lines_per_minute },
            ]}>
              <ProductionPhasesSection
                productionId={productionId}
                productionPhases={production.production_phases ?? []}
                isAdmin={isAdmin}
              />
            </InfoCard>
          )}

          {activeTab === "people" && (
            <ProductionJobs
              productionId={productionId}
              theaterId={production.theater?.id ?? 0}
              playId={production.play?.id ?? 0}
              productionStartDate={production.start_date}
              productionEndDate={production.end_date}
            />
          )}

          {activeTab === "rehearsals" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Link
                  to="/productions/$productionId/rehearsals"
                  params={{ productionId: String(productionId) }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View full rehearsal schedule →
                </Link>
              </div>
              <Card className="p-4 text-sm text-gray-500 text-center">
                Full rehearsal schedule available at the link above.
              </Card>
            </div>
          )}

          {activeTab === "doubling-charts" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Link
                  to="/productions/$productionId/doubling-charts"
                  params={{ productionId: String(productionId) }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View doubling charts →
                </Link>
              </div>
              <Card className="p-4 text-sm text-gray-500 text-center">
                Full doubling charts available at the link above.
              </Card>
            </div>
          )}

          {activeTab === "script" && (
            <div className="space-y-4">
              <div className="flex justify-end gap-4">
                <Link
                  to="/plays/$playId"
                  params={{ playId: String(production.play?.id ?? 0) }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View play →
                </Link>
                {production.play?.has_lines && (
                  <Link
                    to="/plays/$playId/script"
                    params={{ playId: String(production.play?.id ?? 0) }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View script →
                  </Link>
                )}
              </div>
              {production.play?.has_lines ? (
                <Card className="p-4 text-sm text-gray-500 text-center">
                  Full script available at the link above.
                </Card>
              ) : (
                <Card className="p-4 text-sm text-gray-500 text-center">
                  No script has been added to this production yet.
                </Card>
              )}
            </div>
          )}

          {activeTab === "set-design" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Link
                  to="/productions/$productionId/set-design"
                  params={{ productionId: String(productionId) }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View set design →
                </Link>
              </div>
              <Card className="p-4 text-sm text-gray-500 text-center">
                Full set design dashboard available at the link above.
              </Card>
            </div>
          )}
        </>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete production of ${title}? This cannot be undone.`}
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deleteProduction.mutateAsync(productionId);
            navigate({ to: "/productions" });
          }}
          onCancel={clearDelete}
        />
      )}
    </div>
  );
}
