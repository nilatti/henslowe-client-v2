import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { productionSkeletonQueryOptions } from '../../../../features/productions/api/productions'
import { ProductionPhasesSection } from '../../../../features/productions/components/ProductionPhasesSection'
import { useIsSuperAdmin, useUserRoleForProduction } from '../../../../hooks/useUserRole'
import { Card } from '../../../../components/ui'

function formatDate(d: string | null): string {
  if (!d) return '—'
  try {
    return format(parseISO(d), 'MMM d, yyyy')
  } catch {
    return d
  }
}

export const Route = createFileRoute('/_authenticated/productions/$productionId/')({
  component: function ProductionInfoRoute() {
    const { productionId } = Route.useParams()
    const pid = Number(productionId)
    const { data: production } = useSuspenseQuery(productionSkeletonQueryOptions(pid))
    const isSuperAdmin = useIsSuperAdmin()
    const productionRole = useUserRoleForProduction(pid, production.theater?.id ?? 0)
    const isAdmin = productionRole === 'admin' || isSuperAdmin

    return (
      <Card className="p-6">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-medium text-gray-700">Theater</dt>
            <dd className="text-gray-600 mt-1">
              <Link
                to="/theaters/$theaterId"
                params={{ theaterId: String(production.theater?.id ?? 0) }}
                className="text-blue-600 hover:text-blue-800"
              >
                {production.theater?.name}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700">Play</dt>
            <dd className="text-gray-600 mt-1">{production.play?.title}</dd>
          </div>
          {(production.start_date || production.end_date) && (
            <div>
              <dt className="font-medium text-gray-700">Dates</dt>
              <dd className="text-gray-600 mt-1">
                {formatDate(production.start_date)}
                {production.end_date && ` – ${formatDate(production.end_date)}`}
              </dd>
            </div>
          )}
          {production.lines_per_minute != null && (
            <div>
              <dt className="font-medium text-gray-700">Lines per minute</dt>
              <dd className="text-gray-600 mt-1">{production.lines_per_minute}</dd>
            </div>
          )}
        </dl>
        <ProductionPhasesSection
          productionId={pid}
          productionPhases={production.production_phases ?? []}
          isAdmin={isAdmin}
        />
      </Card>
    )
  },
})
