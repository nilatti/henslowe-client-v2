import { createFileRoute } from '@tanstack/react-router'
import { phasesQueryOptions } from '../../../features/phases/queries'
import { PhasesPage } from '../../../features/phases/PhasesPage'

export const Route = createFileRoute('/_authenticated/phases/')({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(phasesQueryOptions()),
  component: PhasesPage,
})
