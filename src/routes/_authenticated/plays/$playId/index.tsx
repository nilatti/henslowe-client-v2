import { createFileRoute } from '@tanstack/react-router'
import { playSkeletonQueryOptions } from '../../../../features/plays/api/plays'
import { PlayDetail } from '../../../../features/plays/components/PlayDetail'

export const Route = createFileRoute('/_authenticated/plays/$playId/')({
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(
      playSkeletonQueryOptions(Number(params.playId))
    ),
  component: function PlayDetailRoute() {
    const { playId } = Route.useParams()
    return <PlayDetail playId={Number(playId)} />
  },
})
