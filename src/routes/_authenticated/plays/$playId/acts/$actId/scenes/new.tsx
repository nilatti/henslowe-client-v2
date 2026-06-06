import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SceneForm } from '../../../../../../../features/scenes/components/SceneForm'
import { Card, PageHeader } from '../../../../../../../components/ui'

export const Route = createFileRoute('/_authenticated/plays/$playId/acts/$actId/scenes/new')({
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
