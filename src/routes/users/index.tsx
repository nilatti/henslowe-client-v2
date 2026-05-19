import { createFileRoute, redirect } from '@tanstack/react-router'
import { usersQueryOptions } from '../../features/users/api/users'
import { UsersList } from '../../features/users/components/UsersList'
import { type RouterContext } from '../../types/router'
import { SUPERUSERS } from '../../utils/constants'

export const Route = createFileRoute('/users/')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
    if (!SUPERUSERS.includes(context.auth.user?.email ?? '')) {
      throw redirect({ to: '/' })
    }
  },
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(usersQueryOptions()),
  component: UsersList,
})
