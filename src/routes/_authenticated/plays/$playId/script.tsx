import { createFileRoute } from '@tanstack/react-router'
import { playScriptQueryOptions } from '../../../../features/script/api/script'
import { ScriptPage } from '../../../../features/script/components/ScriptPage'

export const Route = createFileRoute('/_authenticated/plays/$playId/script')({
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(playScriptQueryOptions(Number(params.playId))),
  component: function ScriptRoute() {
    const { playId } = Route.useParams()
    return <ScriptPage playId={Number(playId)} />
  },
})
