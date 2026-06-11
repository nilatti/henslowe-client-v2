import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { playQueryOptions } from '../../../plays/api/plays'
import CharacterInfoTab from './CharacterInfoTab'
import NewCharacterForm from './NewCharacterForm'
import { CharacterMatrixChart } from './CharacterMatrixChart'
import type { CharacterWithLines, CharacterGroupWithLines } from '../../../plays/types/play'

type CharacterEntry =
  | (CharacterWithLines & { type: 'character' })
  | (CharacterGroupWithLines & { type: 'character_group' })

function tabKey(c: CharacterEntry): string {
  return `${c.type}-${c.id}`
}

interface Props {
  playId: number
  embedded?: boolean
}

export default function CharactersBreakdown({ playId, embedded = false }: Props) {
  const { data: play } = useSuspenseQuery(playQueryOptions(playId))
  const [view, setView] = useState<'details' | 'matrix'>('details')
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const charactersAll: CharacterEntry[] = [
    ...play.characters.map(c => ({ ...c, type: 'character' as const })),
    ...play.character_groups.map(cg => ({ ...cg, type: 'character_group' as const })),
  ]

  // Fall back to first character (or 'new' if empty) if activeKey is stale or unset
  const validKey =
    activeKey &&
    (activeKey === 'new' || charactersAll.some(c => tabKey(c) === activeKey))
  const selectedKey = validKey
    ? activeKey!
    : charactersAll.length > 0
    ? tabKey(charactersAll[0])
    : 'new'

  const selectedCharacter = charactersAll.find(c => tabKey(c) === selectedKey)

  return (
    <div>
      {!embedded && (
        <>
          <div className="mb-4">
            <h2 className="text-2xl font-bold">
              <Link
                to="/plays/$playId"
                params={{ playId: String(playId) }}
                className="hover:text-blue-600"
              >
                {play.title}
              </Link>
            </h2>
            {play.canonical && (
              <p className="text-sm text-gray-500 italic">Canonical Version</p>
            )}
            {play.author && (
              <p className="text-lg text-gray-700">
                by {play.author.first_name} {play.author.last_name}
              </p>
            )}
          </div>
          <h2 className="text-xl font-semibold mb-3">Characters</h2>
        </>
      )}

      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setView('details')}
          className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
            view === 'details'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setView('matrix')}
          className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
            view === 'matrix'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Scene Matrix
        </button>
      </div>

      {view === 'details' && (
        <div className="flex min-h-0">
          {/* Sidebar */}
          <div className="w-52 shrink-0 border-r border-gray-200 overflow-y-auto max-h-[70vh]">
            {charactersAll.map(c => (
              <button
                key={tabKey(c)}
                onClick={() => setActiveKey(tabKey(c))}
                className={`w-full text-left px-3 py-2 text-sm truncate border-b border-gray-100 ${
                  selectedKey === tabKey(c)
                    ? 'bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {c.name}
              </button>
            ))}
            <button
              onClick={() => setActiveKey('new')}
              className={`w-full text-left px-3 py-2 text-sm ${
                selectedKey === 'new'
                  ? 'bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-600'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Add New Character
            </button>
          </div>

          {/* Main panel */}
          <div className="flex-1 min-w-0">
            {selectedKey === 'new' ? (
              <NewCharacterForm
                playId={playId}
                onCreated={(id, type) => setActiveKey(`${type}-${id}`)}
              />
            ) : selectedCharacter ? (
              <CharacterInfoTab key={selectedKey} character={selectedCharacter} playId={playId} />
            ) : null}
          </div>
        </div>
      )}

      {view === 'matrix' && <CharacterMatrixChart playId={playId} />}
    </div>
  )
}
