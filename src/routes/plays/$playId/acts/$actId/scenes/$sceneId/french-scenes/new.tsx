import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { type RouterContext } from '../../../../../../../../types/router'
import { FrenchSceneForm } from '../../../../../../../../features/french_scenes/components/FrenchSceneForm'
import { sceneQueryOptions } from '../../../../../../../../features/scenes/api/scenes'
import { Card, PageHeader } from '../../../../../../../../components/ui'

export const Route = createFileRoute(
  '/plays/$playId/acts/$actId/scenes/$sceneId/french-scenes/new'
)({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(sceneQueryOptions(Number(params.sceneId))),
  component: function NewFrenchSceneRoute() {
    const { playId, actId, sceneId } = Route.useParams()
    const navigate = useNavigate()
    const { data: scene } = useSuspenseQuery(sceneQueryOptions(Number(sceneId)))

    const lastFs = scene.french_scenes[scene.french_scenes.length - 1]
    const nextNumber = lastFs
      ? String.fromCharCode(lastFs.number.toString().charCodeAt(0) + 1)
      : 'a'

    return (
      <div>
        <PageHeader title="New French Scene" />
        <Card className="p-6">
          <FrenchSceneForm
            playId={Number(playId)}
            sceneId={Number(sceneId)}
            nextNumber={nextNumber}
            onSuccess={() =>
              navigate({
                to: '/plays/$playId/acts/$actId/scenes/$sceneId',
                params: { playId, actId, sceneId },
              })
            }
            onCancel={() =>
              navigate({
                to: '/plays/$playId/acts/$actId/scenes/$sceneId',
                params: { playId, actId, sceneId },
              })
            }
          />
        </Card>
      </div>
    )
  },
})
