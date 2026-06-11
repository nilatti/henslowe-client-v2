import { createFileRoute } from '@tanstack/react-router'
import { sceneQueryOptions } from '../../../../../../../../features/scenes/api/scenes'
import { actQueryOptions } from '../../../../../../../../features/acts/api/acts'
import { playSkeletonQueryOptions } from '../../../../../../../../features/plays/api/plays'
import { SceneDetail } from '../../../../../../../../features/scenes/components/SceneDetail'

export const Route = createFileRoute('/_authenticated/plays/$playId/acts/$actId/scenes/$sceneId/')({
  loader: ({ params, context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(sceneQueryOptions(Number(params.sceneId))),
      queryClient.ensureQueryData(actQueryOptions(Number(params.actId))),
      queryClient.ensureQueryData(playSkeletonQueryOptions(Number(params.playId))),
    ]),
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
