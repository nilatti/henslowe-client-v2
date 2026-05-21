import { createFileRoute, redirect } from '@tanstack/react-router'
import { playScriptQueryOptions } from '../../../features/script/api/script'
import PaidPartScripts from '../../../features/script/components/PartScripts/PaidPartScripts'
import { type RouterContext } from '../../../types/router'

export const Route = createFileRoute('/plays/$playId/part-scripts')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(playScriptQueryOptions(Number(params.playId))),
  component: PaidPartScripts,
})
