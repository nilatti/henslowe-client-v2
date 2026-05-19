import { createFileRoute, redirect } from '@tanstack/react-router'
import { userQueryOptions } from '../../../features/users/api/users'
import { UserDetail } from '../../../features/users/components/UserDetail'
import { type RouterContext } from '../../../types/router'

export const Route = createFileRoute('/users/$userId/')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(userQueryOptions(Number(params.userId))),
  component: function UserDetailRoute() {
    const { userId } = Route.useParams()
    return <UserDetail userId={Number(userId)} />
  },
})
