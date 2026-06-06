import { createFileRoute, redirect } from '@tanstack/react-router'
import { usersQueryOptions } from '../../../features/users/api/users'
import { UsersList } from '../../../features/users/components/UsersList'
import { type RouterContext } from '../../../types/router'

export const Route = createFileRoute('/_authenticated/users/')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.user?.is_superadmin) {
      throw redirect({ to: '/' })
    }
  },
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(usersQueryOptions()),
  component: UsersList,
})
