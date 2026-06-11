import { createFileRoute } from '@tanstack/react-router'
import { phaseQueryOptions } from '../../../features/phases/queries'
import { PhaseDetailPage } from '../../../features/phases/PhaseDetailPage'

export const Route = createFileRoute('/_authenticated/phases/$phaseId')({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(phaseQueryOptions(Number(params.phaseId))),
  component: function PhaseDetailRoute() {
    const { phaseId } = Route.useParams()
    return <PhaseDetailPage phaseId={Number(phaseId)} />
  },
})
