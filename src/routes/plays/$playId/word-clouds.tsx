import { createFileRoute, redirect } from '@tanstack/react-router'
import { playScriptQueryOptions } from '../../../features/script/api/script'
import PaidWordClouds from '../../../features/script/components/WordClouds/PaidWordClouds'
import { type RouterContext } from '../../../types/router'

export const Route = createFileRoute('/plays/$playId/word-clouds')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(playScriptQueryOptions(Number(params.playId))),
  component: PaidWordClouds,
})
