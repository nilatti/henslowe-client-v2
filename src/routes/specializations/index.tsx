import { createFileRoute, redirect } from '@tanstack/react-router'
import { type RouterContext } from '../../types/router'
import { specializationsQueryOptions } from '../../features/specializations/queries'
import { SpecializationsPage } from '../../features/specializations/SpecializationsPage'

export const Route = createFileRoute('/specializations/')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) throw redirect({ to: '/login' })
  },
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(specializationsQueryOptions()),
  component: SpecializationsPage,
})
