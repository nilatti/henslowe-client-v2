import { createFileRoute } from '@tanstack/react-router'
import { actQueryOptions } from '../../../../../../features/acts/api/acts'
import { playSkeletonQueryOptions } from '../../../../../../features/plays/api/plays'
import { ActDetail } from '../../../../../../features/acts/components/ActDetail'

export const Route = createFileRoute('/_authenticated/plays/$playId/acts/$actId/')({
  loader: ({ params, context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(actQueryOptions(Number(params.actId))),
      queryClient.ensureQueryData(playSkeletonQueryOptions(Number(params.playId))),
    ]),
  component: function ActDetailRoute() {
    const { playId, actId } = Route.useParams()
    return (
      <ActDetail
        playId={Number(playId)}
        actId={Number(actId)}
      />
    )
  },
})
