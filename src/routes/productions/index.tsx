import { createFileRoute, redirect } from '@tanstack/react-router'
import { productionsQueryOptions } from '../../features/productions/api/productions'
import { playsQueryOptions } from '../../features/plays/api/plays'
import { theatersQueryOptions } from '../../features/theaters/api/theaters'
import { ProductionsList } from '../../features/productions/components/ProductionsList'
import { type RouterContext } from '../../types/router'

export const Route = createFileRoute('/productions/')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(productionsQueryOptions()),
      queryClient.ensureQueryData(playsQueryOptions()),
      queryClient.ensureQueryData(theatersQueryOptions()),
    ]),
  component: function ProductionsRoute() {
    return <ProductionsList />
  },
})
