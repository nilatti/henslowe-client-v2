import { createFileRoute, redirect } from '@tanstack/react-router'
import { spacesQueryOptions } from '../../features/spaces/api/spaces'
import { SpacesList } from '../../features/spaces/components/SpacesList'
import { type RouterContext } from '../../types/router'

export const Route = createFileRoute('/spaces/')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(spacesQueryOptions()),
  component: SpacesList,
})
