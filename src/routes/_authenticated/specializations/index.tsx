import { createFileRoute } from '@tanstack/react-router'
import { specializationsQueryOptions } from '../../../features/specializations/queries'
import { SpecializationsPage } from '../../../features/specializations/SpecializationsPage'

export const Route = createFileRoute('/_authenticated/specializations/')({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(specializationsQueryOptions()),
  component: SpecializationsPage,
})
