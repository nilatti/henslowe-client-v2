import { createFileRoute } from '@tanstack/react-router'
import { spaceQueryOptions } from '../../../../features/spaces/api/spaces'
import { SpaceDetail } from '../../../../features/spaces/components/SpaceDetail'

export const Route = createFileRoute('/_authenticated/spaces/$spaceId/')({
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(spaceQueryOptions(Number(params.spaceId))),
  component: function SpaceDetailRoute() {
    const { spaceId } = Route.useParams()
    return <SpaceDetail spaceId={Number(spaceId)} />
  },
})
