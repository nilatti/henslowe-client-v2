import { useState, Suspense } from 'react'
import { useFreePlayStore } from '../store/freePlayStore'
import { SelectPlay } from './SelectPlay'
import { EditScript } from './EditScript'
import { LoadingSpinner } from '../../../components/ui'

export function CutPlays() {
  const { loading, play, setPlay } = useFreePlayStore()
  const [linesPerMinute, setLinesPerMinute] = useState('')

  if (!play?.id) {
    return (
      <Suspense fallback={<LoadingSpinner message="Loading plays…" />}>
        <SelectPlay />
      </Suspense>
    )
  }

  if (loading) {
    return <LoadingSpinner message="Loading play… this may take a moment" />
  }

  return (
    <>
      <div className="mb-3 text-base text-gray-700">
        Are you ready to cut {play.title}?
      </div>
      <button
        onClick={() => setPlay(null)}
        className="mb-4 px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50"
      >
        Select a different play
      </button>

      <div className="mb-4 flex items-center gap-2 max-w-xs">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Lines Per Minute
        </label>
        <input
          name="lines per minute"
          type="number"
          value={linesPerMinute}
          onChange={e => setLinesPerMinute(e.target.value)}
          className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <EditScript linesPerMinute={linesPerMinute} />
    </>
  )
}
