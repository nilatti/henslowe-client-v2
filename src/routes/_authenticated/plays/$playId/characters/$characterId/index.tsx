import { createFileRoute } from '@tanstack/react-router'
import { playQueryOptions } from '../../../../../../features/plays/api/plays'
import { CharacterDetail } from '../../../../../../features/script/components/Characters/CharacterDetail'

export const Route = createFileRoute('/_authenticated/plays/$playId/characters/$characterId/')({
  loader: ({ params, context: { queryClient } }) =>
    queryClient.ensureQueryData(playQueryOptions(Number(params.playId))),
  component: function CharacterDetailRoute() {
    const { playId, characterId } = Route.useParams()
    return (
      <CharacterDetail
        playId={Number(playId)}
        characterId={Number(characterId)}
      />
    )
  },
})
