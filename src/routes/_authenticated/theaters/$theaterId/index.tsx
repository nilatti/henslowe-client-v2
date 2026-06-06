import { createFileRoute } from '@tanstack/react-router'
import { theaterSkeletonQueryOptions } from '../../../../features/theaters/api/theaters'
import { TheaterDetail } from '../../../../features/theaters/components/TheaterDetail'

export const Route = createFileRoute('/_authenticated/theaters/$theaterId/')({
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(
      theaterSkeletonQueryOptions(Number(params.theaterId))
    ),
  pendingComponent: () => (
    <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
      Loading…
    </div>
  ),
  component: function TheaterDetailRoute() {
    const { theaterId } = Route.useParams()
    return <TheaterDetail theaterId={Number(theaterId)} />
  },
})
