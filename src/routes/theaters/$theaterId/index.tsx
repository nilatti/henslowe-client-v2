import { createFileRoute, redirect } from '@tanstack/react-router'
import { theaterSkeletonQueryOptions } from '../../../features/theaters/api/theaters'
import { TheaterDetail } from '../../../features/theaters/components/TheaterDetail'
import { type RouterContext } from '../../../types/router'

export const Route = createFileRoute('/theaters/$theaterId/')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(
      theaterSkeletonQueryOptions(Number(params.theaterId))
    ),
  component: function TheaterDetailRoute() {
    const { theaterId } = Route.useParams()
    return <TheaterDetail theaterId={Number(theaterId)} />
  },
})
