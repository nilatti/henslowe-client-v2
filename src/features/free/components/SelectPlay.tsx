import { useSuspenseQuery } from '@tanstack/react-query'
import { playsQueryOptions } from '../../plays/api/plays'
import { useFreePlayStore } from '../store/freePlayStore'
import { LoadingSpinner } from '../../../components/ui'

export function SelectPlay() {
  const { data: allPlays } = useSuspenseQuery(playsQueryOptions())
  const { getPlay, loading } = useFreePlayStore()

  const plays = allPlays.filter(p => p.author?.last_name === 'Shakespeare')

  if (loading) {
    return <LoadingSpinner message="Loading play… this may take a moment" />
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = Number(e.target.value)
    if (id) getPlay(id)
  }

  return (
    <div className="max-w-sm">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Choose the play
      </label>
      <select
        defaultValue=""
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="" disabled>
          Select a play…
        </option>
        {plays.map(p => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
    </div>
  )
}
