import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { playQueryOptions } from '../../../plays/api/plays'
import CharacterInfoTab from './CharacterInfoTab'
import { PageHeader } from '../../../../components/ui'

interface CharacterDetailProps {
  playId: number
  characterId: number
}

export function CharacterDetail({ playId, characterId }: CharacterDetailProps) {
  const { data: play } = useSuspenseQuery(playQueryOptions(playId))

  const character =
    play.characters.find(c => c.id === characterId)
      ? { ...play.characters.find(c => c.id === characterId)!, type: 'character' as const }
      : play.character_groups.find(cg => cg.id === characterId)
      ? { ...play.character_groups.find(cg => cg.id === characterId)!, type: 'character_group' as const }
      : null

  if (!character) {
    return <p className="text-gray-500">Character not found.</p>
  }

  return (
    <div>
      <div className="mb-2 flex gap-2 text-sm">
        <Link
          to="/plays/$playId"
          params={{ playId: String(playId) }}
          className="text-blue-600 hover:text-blue-800"
        >
          {play.title}
        </Link>
        <span className="text-gray-400">→</span>
        <span className="text-gray-600">{character.name}</span>
      </div>

      <PageHeader title={character.name} />

      <CharacterInfoTab character={character} playId={playId} />
    </div>
  )
}
