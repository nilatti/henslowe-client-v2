import { createFileRoute, redirect } from '@tanstack/react-router'
import { playSkeletonQueryOptions } from '../../../features/plays/api/plays'
import { PlayDetail } from '../../../features/plays/components/PlayDetail'
import { type RouterContext } from '../../../types/router'

export const Route = createFileRoute('/plays/$playId/')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(
      playSkeletonQueryOptions(Number(params.playId))
    ),
  component: function PlayDetailRoute() {
    const { playId } = Route.useParams()
    return <PlayDetail playId={Number(playId)} />
  },
})
