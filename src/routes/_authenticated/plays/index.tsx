import { createFileRoute } from '@tanstack/react-router'
import { playsQueryOptions } from '../../../features/plays/api/plays'
import { PlaysList } from '../../../features/plays/components/PlaysList'

export const Route = createFileRoute('/_authenticated/plays/')({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(playsQueryOptions()),
  component: PlaysList,
})
