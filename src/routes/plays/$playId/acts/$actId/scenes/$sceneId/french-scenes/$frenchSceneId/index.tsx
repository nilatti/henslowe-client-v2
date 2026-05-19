import { createFileRoute, redirect } from '@tanstack/react-router'
import { frenchSceneQueryOptions } from '../../../../../../../../../features/french_scenes/api/frenchScenes'
import { playSkeletonQueryOptions } from '../../../../../../../../../features/plays/api/plays'
import { FrenchSceneDetail } from '../../../../../../../../../features/french_scenes/components/FrenchSceneDetail'
import { type RouterContext } from '../../../../../../../../../types/router'

export const Route = createFileRoute(
  '/plays/$playId/acts/$actId/scenes/$sceneId/french-scenes/$frenchSceneId/'
)({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: ({ params, context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(
        frenchSceneQueryOptions(Number(params.frenchSceneId))
      ),
      queryClient.ensureQueryData(
        playSkeletonQueryOptions(Number(params.playId))
      ),
    ]),
  component: function FrenchSceneDetailRoute() {
    const { playId, actId, sceneId, frenchSceneId } = Route.useParams()
    return (
      <FrenchSceneDetail
        playId={Number(playId)}
        actId={Number(actId)}
        sceneId={Number(sceneId)}
        frenchSceneId={Number(frenchSceneId)}
      />
    )
  },
})
