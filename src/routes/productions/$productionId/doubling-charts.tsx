import { createFileRoute, redirect } from '@tanstack/react-router'
import { productionSkeletonQueryOptions } from '../../../features/productions/api/productions'
import { productionJobsQueryOptions } from '../../../features/jobs/api/jobs'
import { DoublingChartContainer } from '../../../features/productions/components/DoublingChartContainer'
import { type RouterContext } from '../../../types/router'

export const Route = createFileRoute('/productions/$productionId/doubling-charts')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
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
