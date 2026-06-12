import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { productionSkeletonQueryOptions } from '../../../../features/productions/api/productions'
import { Card } from '../../../../components/ui'

export const Route = createFileRoute('/_authenticated/productions/$productionId/script')({
  component: function ScriptRoute() {
    const { productionId } = Route.useParams()
    const pid = Number(productionId)
    const { data: production } = useSuspenseQuery(productionSkeletonQueryOptions(pid))
    const playId = production.play?.id ?? 0

    return (
      <div className="space-y-4">
        <div className="flex justify-end gap-4">
          <Link
            to="/plays/$playId"
            params={{ playId: String(playId) }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View play →
          </Link>
          <Link
            to="/plays/$playId/script"
            params={{ playId: String(playId) }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View script →
          </Link>
        </div>
        <Card className="p-4 text-sm text-gray-500 text-center">
          Full script available at the link above.
        </Card>
      </div>
    )
  },
})
