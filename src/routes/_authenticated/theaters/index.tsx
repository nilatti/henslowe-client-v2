import { createFileRoute } from '@tanstack/react-router'
import { theatersQueryOptions } from '../../../features/theaters/api/theaters'
import { TheatersList } from '../../../features/theaters/components/TheatersList'
import { userAllJobsQueryOptions } from '../../../hooks/useUserRole'

export const Route = createFileRoute('/_authenticated/theaters/')({
  loader: ({ context: { queryClient, auth } }) => {
    const userId = auth.user?.id
    return Promise.all([
      queryClient.ensureQueryData(theatersQueryOptions()),
      userId ? queryClient.ensureQueryData(userAllJobsQueryOptions(userId)) : Promise.resolve(),
    ])
  },
  component: TheatersList,
})
