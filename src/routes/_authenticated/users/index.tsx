import { createFileRoute } from '@tanstack/react-router'
import { usersQueryOptions } from '../../../features/users/api/users'
import { UsersList } from '../../../features/users/components/UsersList'

export const Route = createFileRoute('/_authenticated/users/')({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(usersQueryOptions()),
  component: UsersList,
})
