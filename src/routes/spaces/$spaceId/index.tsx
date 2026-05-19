import { createFileRoute, redirect } from '@tanstack/react-router'
import { spaceQueryOptions } from '../../../features/spaces/api/spaces'
import { SpaceDetail } from '../../../features/spaces/components/SpaceDetail'
import { type RouterContext } from '../../../types/router'

export const Route = createFileRoute('/spaces/$spaceId/')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(spaceQueryOptions(Number(params.spaceId))),
  component: function SpaceDetailRoute() {
    const { spaceId } = Route.useParams()
    return <SpaceDetail spaceId={Number(spaceId)} />
  },
})
