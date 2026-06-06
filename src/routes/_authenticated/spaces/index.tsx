import { createFileRoute } from '@tanstack/react-router'
import { spacesQueryOptions } from '../../../features/spaces/api/spaces'
import { SpacesList } from '../../../features/spaces/components/SpacesList'

export const Route = createFileRoute('/_authenticated/spaces/')({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(spacesQueryOptions()),
  component: SpacesList,
})
