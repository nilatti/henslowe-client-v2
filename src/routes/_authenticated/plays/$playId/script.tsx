import { createFileRoute } from '@tanstack/react-router'
import { playScriptQueryOptions } from '../../../../features/script/api/script'
import { ScriptPage } from '../../../../features/script/components/ScriptPage'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner'

export const Route = createFileRoute('/_authenticated/plays/$playId/script')({
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(playScriptQueryOptions(Number(params.playId))),
  pendingComponent: () => <LoadingSpinner message="Loading script…" />,
  component: function ScriptRoute() {
    const { playId } = Route.useParams()
    return <ScriptPage playId={Number(playId)} />
  },
})
