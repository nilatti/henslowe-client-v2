import { createFileRoute, redirect } from '@tanstack/react-router'
import { actQueryOptions } from '../../../../../features/acts/api/acts'
import { ActDetail } from '../../../../../features/acts/components/ActDetail'
import { type RouterContext } from '../../../../../types/router'

export const Route = createFileRoute('/plays/$playId/acts/$actId/')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(actQueryOptions(Number(params.actId))),
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
