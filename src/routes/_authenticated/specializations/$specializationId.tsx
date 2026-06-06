import { createFileRoute } from '@tanstack/react-router'
import { specializationQueryOptions } from '../../../features/specializations/queries'
import { SpecializationDetailPage } from '../../../features/specializations/SpecializationDetailPage'

export const Route = createFileRoute('/_authenticated/specializations/$specializationId')({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(
      specializationQueryOptions(Number(params.specializationId))
    ),
  component: function SpecializationDetailRoute() {
    const { specializationId } = Route.useParams()
    return <SpecializationDetailPage specializationId={Number(specializationId)} />
  },
})
