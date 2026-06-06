import { createFileRoute } from '@tanstack/react-router'
import { authorsQueryOptions } from '../../../features/authors/api/authors'
import { AuthorsList } from '../../../features/authors/components/AuthorsList'

export const Route = createFileRoute('/_authenticated/authors/')({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(authorsQueryOptions()),
  component: AuthorsList,
})
