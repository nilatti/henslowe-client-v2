import { Suspense, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useFreePlayStore } from '../store/freePlayStore'
import { SelectPlay } from './SelectPlay'
import { LoadingSpinner } from '../../../components/ui'
import { buildUserName } from '../../../utils/actorUtils'
import type { FakeActorCounts, FreeCasting, FakeActor } from '../types/freePlay'

interface FakeActorsPanelProps {
  actors: FakeActorCounts
  onSubmit: (counts: FakeActorCounts) => void
}

function FakeActorsPanel({ actors, onSubmit }: FakeActorsPanelProps) {
  const [open, setOpen] = useState(true)
  const [female, setFemale] = useState(actors.female)
  const [male, setMale] = useState(actors.male)
  const [nonbinary, setNonbinary] = useState(actors.nonbinary)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ female, male, nonbinary })
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
        onClick={() => setOpen(true)}
      >
        Change actor count
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xs space-y-2 mb-4">
      <p className="text-xs text-gray-500 italic">
        Please note, you cannot make the number lower than the current count for
        a given gender.
      </p>
      {(
        [
          { label: 'Female Actors', key: 'female', value: female, set: setFemale },
          { label: 'Male Actors', key: 'male', value: male, set: setMale },
          { label: 'Nonbinary actors / gender fluid roles', key: 'nonbinary', value: nonbinary, set: setNonbinary },
        ] as const
      ).map(({ label, key, value, set }) => (
        <div key={key} className="flex items-center gap-2">
          <label className="text-sm w-48">{label}</label>
          <input
            type="number"
            min={actors[key]}
            max={999}
            value={value}
            onChange={e => set(Number(e.target.value))}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
      ))}
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Submit
        </button>
        <button
          type="button"
          className="px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

interface CastingRowProps {
  casting: FreeCasting
  availableActors: FakeActor[]
  onFormSubmit: (casting: FreeCasting, actor: FakeActor) => void
}

function CastingItem({ casting, availableActors, onFormSubmit }: CastingRowProps) {
  const [editing, setEditing] = useState(false)
  const [selectedId, setSelectedId] = useState<number | ''>(casting.user?.id ?? '')

  const lineCount = casting.character.new_line_count ?? casting.character.original_line_count

  function handleCast() {
    const actor = availableActors.find(a => a.id === selectedId)
    if (actor) {
      onFormSubmit(casting, actor)
      setEditing(false)
    }
  }

  const actorName = casting.user ? buildUserName(casting.user) : null

  return (
    <li className="flex items-center gap-2 px-4 py-2 text-sm border-b border-gray-100 last:border-0">
      <span className="font-medium text-gray-900 w-40 truncate">
        {casting.character.name}
        {lineCount != null && lineCount > 0 && (
          <span className="text-xs text-gray-400 ml-1">({lineCount})</span>
        )}
      </span>
      {editing ? (
        <div className="flex items-center gap-2">
          <select
            value={selectedId}
            onChange={e => setSelectedId(Number(e.target.value))}
            autoFocus
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="">Select actor</option>
            {availableActors.map(a => (
              <option key={a.id} value={a.id}>
                {buildUserName(a)}
              </option>
            ))}
          </select>
          <button
            onClick={handleCast}
            disabled={!selectedId}
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded disabled:opacity-50"
          >
            Cast
          </button>
          <button
            onClick={() => setEditing(false)}
            className="px-2 py-1 border border-gray-300 text-xs rounded"
          >
            Cancel
          </button>
        </div>
      ) : (
        <span
          className="cursor-pointer hover:text-blue-600 text-sm"
          onClick={() => setEditing(true)}
        >
          {actorName ?? <strong className="text-blue-600">Click to cast</strong>}
        </span>
      )}
    </li>
  )
}

export function Casting() {
  const {
    castings,
    loading,
    fakeActors,
    fakeActorsArray,
    setFakeActors,
    play,
    updateActorJobs,
    updateCastings,
  } = useFreePlayStore()

  function onCastingSubmit(casting: FreeCasting, actor: FakeActor) {
    updateActorJobs(actor, casting)
    updateCastings(casting, actor)
  }

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
      <FakeActorsPanel actors={fakeActors} onSubmit={setFakeActors} />
      <p className="text-sm text-gray-500 italic mb-3">
        Number beside character name indicates line count in your cut text (or in
        the original text if you haven't{' '}
        <Link to="/free/cut" className="text-blue-600 hover:underline">
          done your cut
        </Link>{' '}
        yet).
      </p>
      {fakeActorsArray.length > 0 && (
        <ul className="border border-gray-200 rounded divide-y divide-gray-100 max-w-lg">
          {castings.map(casting => (
            <CastingItem
              key={casting.character.id}
              casting={casting}
              availableActors={fakeActorsArray}
              onFormSubmit={onCastingSubmit}
            />
          ))}
        </ul>
      )}
    </>
  )
}
