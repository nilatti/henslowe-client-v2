import { createFileRoute } from '@tanstack/react-router'
import { productionSkeletonQueryOptions } from '../../../../features/productions/api/productions'
import { SetDesignDashboard } from '../../../../features/productions/components/SetDesign/SetDesignDashboard'

export const Route = createFileRoute('/_authenticated/productions/$productionId/set-design')({
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(
      productionSkeletonQueryOptions(Number(params.productionId))
    ),
  component: function SetDesignRoute() {
    const { productionId } = Route.useParams()
    return <SetDesignDashboard productionId={Number(productionId)} />
  },
})
