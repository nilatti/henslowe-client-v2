import { useRef } from 'react'
import ActorParts from './ActorParts'
import CharacterParts from './CharacterParts'
import { buildUserName, type User } from '../../../../utils/actorUtils'
import type { PlayScript } from '../../types/script'
import type { ActorWithJobs } from './types'

interface Character {
  id: number
  name: string
}

type ContextItem = ActorWithJobs | Character

function isActor(item: ContextItem): item is ActorWithJobs {
  return 'first_name' in item
}

interface PartScriptPresenterProps {
  context: ContextItem[]
  play: PlayScript
}

export default function PartScriptPresenter({ context, play }: PartScriptPresenterProps) {
  const elementRefs = useRef<(HTMLDivElement | null)[]>([])

  return (
    <div>
      <hr />
      <div className="border-2 border-gray-800 rounded p-6 mb-4">
        <h3 className="text-base font-semibold mb-2">Jump to parts:</h3>
        <div className="flex flex-wrap gap-2">
          {context.map((item, index) => (
            <button
              key={index}
              onClick={() =>
                elementRefs.current[index]?.scrollIntoView({ behavior: 'smooth' })
              }
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              {isActor(item) ? buildUserName(item as User) : item.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        {context.map((item, index) => (
          <div
            key={index}
            ref={el => {
              elementRefs.current[index] = el
            }}
            className="pt-6"
          >
            {isActor(item) ? (
              <ActorParts actor={item} play={play} />
            ) : (
              <CharacterParts character={item} play={play} />
            )}
            <hr className="mt-4" />
          </div>
        ))}
      </div>
    </div>
  )
}
