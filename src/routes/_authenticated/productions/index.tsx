import { createFileRoute } from '@tanstack/react-router'
import { productionsQueryOptions } from '../../../features/productions/api/productions'
import { playsQueryOptions } from '../../../features/plays/api/plays'
import { theatersQueryOptions } from '../../../features/theaters/api/theaters'
import { ProductionsList } from '../../../features/productions/components/ProductionsList'

export const Route = createFileRoute('/_authenticated/productions/')({
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
