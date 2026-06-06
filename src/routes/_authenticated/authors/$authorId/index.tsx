import { createFileRoute } from '@tanstack/react-router'
import { authorQueryOptions } from '../../../../features/authors/api/authors'
import { AuthorDetail } from '../../../../features/authors/components/AuthorDetail'

export const Route = createFileRoute('/_authenticated/authors/$authorId/')({
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(authorQueryOptions(Number(params.authorId))),
  component: function AuthorDetailRoute() {
    const { authorId } = Route.useParams()
    return <AuthorDetail authorId={Number(authorId)} />
  },
})
