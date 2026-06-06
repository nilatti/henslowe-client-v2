import { createFileRoute } from '@tanstack/react-router'
import { productionSkeletonQueryOptions } from '../../../../features/productions/api/productions'
import { productionJobsQueryOptions } from '../../../../features/jobs/api/jobs'
import { DoublingChartContainer } from '../../../../features/productions/components/DoublingChartContainer'

export const Route = createFileRoute('/_authenticated/productions/$productionId/doubling-charts')({
  loader: ({ params, context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(
        productionSkeletonQueryOptions(Number(params.productionId))
      ),
      queryClient.ensureQueryData(
        productionJobsQueryOptions(Number(params.productionId))
      ),
    ]),
  component: function DoublingChartRoute() {
    const { productionId } = Route.useParams()
    return <DoublingChartContainer productionId={Number(productionId)} />
  },
})
