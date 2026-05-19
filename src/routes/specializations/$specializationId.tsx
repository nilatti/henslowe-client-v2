import { createFileRoute, redirect } from '@tanstack/react-router'
import { type RouterContext } from '../../types/router'
import { specializationQueryOptions } from '../../features/specializations/queries'
import { SpecializationDetailPage } from '../../features/specializations/SpecializationDetailPage'

export const Route = createFileRoute('/specializations/$specializationId')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) throw redirect({ to: '/login' })
  },
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(
      specializationQueryOptions(Number(params.specializationId))
    ),
  component: function SpecializationDetailRoute() {
    const { specializationId } = Route.useParams()
    return <SpecializationDetailPage specializationId={Number(specializationId)} />
  },
})
