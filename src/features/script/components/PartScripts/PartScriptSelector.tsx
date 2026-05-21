import { useState } from 'react'
import { buildUserName, type User } from '../../../../utils/actorUtils'
import type { ActorWithJobs } from './types'

interface Character {
  id: number
  name: string
}

interface SelectedActor extends ActorWithJobs {
  isSelected: boolean
}

interface SelectedCharacter extends Character {
  isSelected: boolean
}

interface PartScriptSelectorProps {
  actors: ActorWithJobs[]
  characters: Character[]
  onFormSubmit: (actors: ActorWithJobs[], characters: Character[]) => void
}

export default function PartScriptSelector({
  actors,
  characters,
  onFormSubmit,
}: PartScriptSelectorProps) {
  const [selectedActors, setSelectedActors] = useState<SelectedActor[]>(
    actors.map(a => ({ ...a, isSelected: false }))
  )
  const [selectedCharacters, setSelectedCharacters] = useState<SelectedCharacter[]>(
    characters.map(c => ({ ...c, isSelected: false }))
  )

  function submitSelection() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    onFormSubmit(
      selectedActors.filter(a => a.isSelected),
      selectedCharacters.filter(c => c.isSelected)
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Select Characters (optional)</h3>
        <div className="flex flex-wrap gap-2">
          {selectedCharacters.map(c => (
            <label key={c.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={c.isSelected}
                onChange={() =>
                  setSelectedCharacters(prev =>
                    prev.map(x => (x.id === c.id ? { ...x, isSelected: !x.isSelected } : x))
                  )
                }
                className="rounded"
              />
              {c.name}
            </label>
          ))}
        </div>
      </div>

      {selectedActors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Select Actors (optional)</h3>
          <div className="flex flex-wrap gap-2">
            {selectedActors.map(a => (
              <label key={a.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={a.isSelected}
                  onChange={() =>
                    setSelectedActors(prev =>
                      prev.map(x => (x.id === a.id ? { ...x, isSelected: !x.isSelected } : x))
                    )
                  }
                  className="rounded"
                />
                {buildUserName(a as User)}
              </label>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={submitSelection}
        className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
      >
        Generate Part Scripts
      </button>
    </div>
  )
}
