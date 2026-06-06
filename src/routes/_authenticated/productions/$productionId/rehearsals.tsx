import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { productionRehearsalsQueryOptions } from '../../../../features/rehearsals/api/rehearsals'
import { productionJobsQueryOptions } from '../../../../features/jobs/api/jobs'
import { productionSkeletonQueryOptions } from '../../../../features/productions/api/productions'
import { RehearsalSchedule } from '../../../../features/rehearsals/components/RehearsalSchedule'

export const Route = createFileRoute('/_authenticated/productions/$productionId/rehearsals')({
  loader: ({ params, context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(
        productionRehearsalsQueryOptions(Number(params.productionId))
      ),
      queryClient.ensureQueryData(
        productionJobsQueryOptions(Number(params.productionId))
      ),
      queryClient.ensureQueryData(
        productionSkeletonQueryOptions(Number(params.productionId))
      ),
    ]),
  component: function RehearsalScheduleRoute() {
    const { productionId } = Route.useParams()
    const pid = Number(productionId)
    const { data: production } = useSuspenseQuery(
      productionSkeletonQueryOptions(pid)
    )
    return (
      <RehearsalSchedule
        productionId={pid}
        playId={production.play.id}
        productionTitle={production.play.title}
        theaterId={production.theater.id}
        theaterName={production.theater.name}
      />
    )
  },
})
