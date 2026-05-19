import { createFileRoute, redirect } from '@tanstack/react-router'
import { playsQueryOptions } from '../../features/plays/api/plays'
import { PlaysList } from '../../features/plays/components/PlaysList'
import { type RouterContext } from '../../types/router'

export const Route = createFileRoute('/plays/')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(playsQueryOptions()),
  component: PlaysList,
})
