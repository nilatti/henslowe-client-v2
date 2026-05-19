import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  productionSkeletonQueryOptions,
} from '../../../features/productions/api/productions'
import { playsQueryOptions } from '../../../features/plays/api/plays'
import { theatersQueryOptions } from '../../../features/theaters/api/theaters'
import { ProductionDetail } from '../../../features/productions/components/ProductionDetail'
import { type RouterContext } from '../../../types/router'

export const Route = createFileRoute('/productions/$productionId/')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: ({ params, context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(
        productionSkeletonQueryOptions(Number(params.productionId))
      ),
      queryClient.ensureQueryData(playsQueryOptions()),
      queryClient.ensureQueryData(theatersQueryOptions()),
    ]),
  component: function ProductionDetailRoute() {
    const { productionId } = Route.useParams()
    return <ProductionDetail productionId={Number(productionId)} />
  },
})
