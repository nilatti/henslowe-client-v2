import { createFileRoute, redirect } from '@tanstack/react-router'
import { sceneQueryOptions } from '../../../../../../../features/scenes/api/scenes'
import { SceneDetail } from '../../../../../../../features/scenes/components/SceneDetail'
import { type RouterContext } from '../../../../../../../types/router'

export const Route = createFileRoute('/plays/$playId/acts/$actId/scenes/$sceneId/')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) throw redirect({ to: '/login' })
  },
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(sceneQueryOptions(Number(params.sceneId))),
  component: function SceneDetailRoute() {
    const { playId, actId, sceneId } = Route.useParams()
    return (
      <SceneDetail
        playId={Number(playId)}
        actId={Number(actId)}
        sceneId={Number(sceneId)}
      />
    )
  },
})
