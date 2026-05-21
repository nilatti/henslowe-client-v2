import { useState } from 'react'
import PartScriptSelector from './PartScriptSelector'
import PartScriptPresenter from './PartScriptPresenter'
import type { PlayScript } from '../../types/script'
import type { ActorWithJobs } from './types'

interface Character {
  id: number
  name: string
}

type ContextItem = ActorWithJobs | Character

interface PartScriptContainerProps {
  actors: ActorWithJobs[]
  play: PlayScript
}

export default function PartScriptContainer({ actors, play }: PartScriptContainerProps) {
  const [context, setContext] = useState<ContextItem[] | undefined>()
  const [selectOpen, setSelectOpen] = useState(false)

  function contextOrganizer(
    selectedActors: ActorWithJobs[],
    selectedChars: Character[]
  ) {
    setContext([...selectedActors, ...selectedChars])
    setSelectOpen(false)
  }

  return (
    <div className="flex flex-col">
      {selectOpen || !context ? (
        <PartScriptSelector
          actors={actors}
          characters={play.characters}
          onFormSubmit={contextOrganizer}
        />
      ) : (
        <>
          <button
            onClick={() => setSelectOpen(true)}
            className="mb-4 px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50 self-start"
          >
            Select roles and actors
          </button>
          <PartScriptPresenter context={context} play={play} />
        </>
      )}
    </div>
  )
}
