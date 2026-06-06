import { createFileRoute } from '@tanstack/react-router'
import { playScriptQueryOptions } from '../../../../features/script/api/script'
import PaidWordClouds from '../../../../features/script/components/WordClouds/PaidWordClouds'

export const Route = createFileRoute('/_authenticated/plays/$playId/word-clouds')({
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(playScriptQueryOptions(Number(params.playId))),
  component: PaidWordClouds,
})
