import { createFileRoute } from '@tanstack/react-router'
import { userQueryOptions } from '../../../../features/users/api/users'
import { UserDetail } from '../../../../features/users/components/UserDetail'

export const Route = createFileRoute('/_authenticated/users/$userId/')({
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(userQueryOptions(Number(params.userId))),
  component: function UserDetailRoute() {
    const { userId } = Route.useParams()
    return <UserDetail userId={Number(userId)} />
  },
})
