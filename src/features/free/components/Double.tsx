import { Suspense } from 'react'
import { useFreePlayStore } from '../store/freePlayStore'
import { SelectPlay } from './SelectPlay'
import { FreeDoublingChartContainer } from './DoublingChartContainer'
import { LoadingSpinner } from '../../../components/ui'

export function Double() {
  const { loading, play, setPlay } = useFreePlayStore()

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
      <h2 className="text-xl font-semibold mb-3">Doubling chart for {play.title}</h2>
      <button
        onClick={() => setPlay(null)}
        className="mb-4 px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50"
      >
        Select a different play
      </button>
      <FreeDoublingChartContainer />
    </>
  )
}
