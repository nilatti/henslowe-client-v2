import { Suspense, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useFreePlayStore } from '../store/freePlayStore'
import { SelectPlay } from './SelectPlay'
import { Button, LoadingSpinner } from '../../../components/ui'
import { buildUserName, sortUsers } from '../../../utils/actorUtils'
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
    <li className="flex items-center justify-between px-4 py-3 text-sm border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium text-gray-900 truncate">
          {casting.character.name}
        </span>
        {lineCount != null && lineCount > 0 && (
          <span className="text-xs text-gray-400 shrink-0">({lineCount} lines)</span>
        )}
      </div>
      <div className="flex items-center gap-2 ml-4 shrink-0">
        {editing ? (
          <div className="flex items-center gap-2">
            <select
              value={selectedId}
              onChange={e => setSelectedId(Number(e.target.value))}
              autoFocus
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="">Select actor</option>
              {sortUsers(availableActors).map(a => (
                <option key={a.id} value={a.id}>
                  {buildUserName(a)}
                </option>
              ))}
            </select>
            <Button onClick={handleCast} disabled={!selectedId}>
              Cast
            </Button>
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <>
            {actorName ? (
              <span className="text-amber-600 italic">{actorName}</span>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="text-blue-600 font-semibold hover:text-blue-800"
              >
                Click to cast
              </button>
            )}
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Change
            </Button>
          </>
        )}
      </div>
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
    setPlay,
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
      <div className="mb-3 text-base text-gray-700">
        Casting for {play.title}
      </div>
      <button
        onClick={() => setPlay(null)}
        className="mb-4 px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50"
      >
        Select a different play
      </button>
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
