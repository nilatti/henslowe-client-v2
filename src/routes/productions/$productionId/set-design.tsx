import { createFileRoute, redirect } from '@tanstack/react-router'
import { productionSkeletonQueryOptions } from '../../../features/productions/api/productions'
import { SetDesignDashboard } from '../../../features/productions/components/SetDesign/SetDesignDashboard'
import { type RouterContext } from '../../../types/router'

export const Route = createFileRoute('/productions/$productionId/set-design')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(
      productionSkeletonQueryOptions(Number(params.productionId))
    ),
  component: function SetDesignRoute() {
    const { productionId } = Route.useParams()
    return <SetDesignDashboard productionId={Number(productionId)} />
  },
})
