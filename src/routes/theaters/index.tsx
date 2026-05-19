import { createFileRoute, redirect } from '@tanstack/react-router'
import { theatersQueryOptions } from '../../features/theaters/api/theaters'
import { TheatersList } from '../../features/theaters/components/TheatersList'
import { type RouterContext } from '../../types/router'

export const Route = createFileRoute('/theaters/')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(theatersQueryOptions()),
  component: TheatersList,
})
