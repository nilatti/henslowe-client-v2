import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { productionSkeletonQueryOptions } from '../../../../features/productions/api/productions'
import { productionJobsQueryOptions } from '../../../../features/jobs/api/jobs'
import { ProductionJobs } from '../../../../features/jobs/components/ProductionJobs'

export const Route = createFileRoute('/_authenticated/productions/$productionId/people')({
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(productionJobsQueryOptions(Number(params.productionId))),
  component: function PeopleRoute() {
    const { productionId } = Route.useParams()
    const pid = Number(productionId)
    const { data: production } = useSuspenseQuery(productionSkeletonQueryOptions(pid))
    return (
      <ProductionJobs
        productionId={pid}
        theaterId={production.theater?.id ?? 0}
        playId={production.play?.id ?? 0}
        productionStartDate={production.start_date}
        productionEndDate={production.end_date}
      />
    )
  },
})
