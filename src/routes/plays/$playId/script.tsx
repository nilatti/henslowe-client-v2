import { createFileRoute, redirect } from '@tanstack/react-router'
import { playScriptQueryOptions } from '../../../features/script/api/script'
import { ScriptPage } from '../../../features/script/components/ScriptPage'
import { type RouterContext } from '../../../types/router'

export const Route = createFileRoute('/plays/$playId/script')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(playScriptQueryOptions(Number(params.playId))),
  component: function ScriptRoute() {
    const { playId } = Route.useParams()
    return <ScriptPage playId={Number(playId)} />
  },
})
