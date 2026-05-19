import { createFileRoute, redirect } from '@tanstack/react-router'
import { authorQueryOptions } from '../../../features/authors/api/authors'
import { AuthorDetail } from '../../../features/authors/components/AuthorDetail'
import { type RouterContext } from '../../../types/router'

export const Route = createFileRoute('/authors/$authorId/')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(authorQueryOptions(Number(params.authorId))),
  component: function AuthorDetailRoute() {
    const { authorId } = Route.useParams()
    return <AuthorDetail authorId={Number(authorId)} />
  },
})
