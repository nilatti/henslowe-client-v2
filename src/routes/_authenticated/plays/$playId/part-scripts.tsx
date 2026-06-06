import { createFileRoute } from '@tanstack/react-router'
import { playScriptQueryOptions } from '../../../../features/script/api/script'
import PaidPartScripts from '../../../../features/script/components/PartScripts/PaidPartScripts'

export const Route = createFileRoute('/_authenticated/plays/$playId/part-scripts')({
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(playScriptQueryOptions(Number(params.playId))),
  component: PaidPartScripts,
})
