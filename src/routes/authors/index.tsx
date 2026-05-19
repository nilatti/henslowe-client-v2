import { createFileRoute, redirect } from '@tanstack/react-router'
import { authorsQueryOptions } from '../../features/authors/api/authors'
import { AuthorsList } from '../../features/authors/components/AuthorsList'
import { type RouterContext } from '../../types/router'

export const Route = createFileRoute('/authors/')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(authorsQueryOptions()),
  component: AuthorsList,
})
