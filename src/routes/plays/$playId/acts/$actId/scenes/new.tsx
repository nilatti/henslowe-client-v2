import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { type RouterContext } from '../../../../../../types/router'
import { SceneForm } from '../../../../../../features/scenes/components/SceneForm'
import { Card, PageHeader } from '../../../../../../components/ui'

export const Route = createFileRoute('/plays/$playId/acts/$actId/scenes/new')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: function NewSceneRoute() {
    const { playId, actId } = Route.useParams()
    const navigate = useNavigate()
    return (
      <div>
        <PageHeader title="New Scene" />
        <Card className="p-6">
          <SceneForm
            playId={Number(playId)}
            actId={Number(actId)}
            onSuccess={() =>
              navigate({
                to: '/plays/$playId/acts/$actId',
                params: { playId, actId },
              })
            }
            onCancel={() =>
              navigate({
                to: '/plays/$playId/acts/$actId',
                params: { playId, actId },
              })
            }
          />
        </Card>
      </div>
    )
  },
})
