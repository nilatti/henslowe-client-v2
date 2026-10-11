import { useState } from 'react'

interface MoveItemFormProps {
  // The number of the item being moved, for the label.
  number: string
  // Returns an error message, or null once the move has been made.
  onSubmit: (targetNumber: string, placement: 'after' | 'before') => string | null
  onCancel: () => void
}

// Moves a script item next to another one, found by its number. Used for moves
// too far to drag, e.g. across acts.
export function MoveItemForm({ number, onSubmit, onCancel }: MoveItemFormProps) {
  const [target, setTarget] = useState('')
  const [placement, setPlacement] = useState<'after' | 'before'>('after')
  const [error, setError] = useState<string | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(onSubmit(target, placement))
  }

  return (
    <form
      onSubmit={submit}
      onKeyDown={e => { if (e.key === 'Escape') onCancel() }}
      className="ml-16 my-1 flex flex-wrap items-center gap-2 rounded border border-blue-200 bg-blue-50 px-3 py-2 font-sans text-xs text-gray-700"
    >
      <span>Move {number}</span>
      <select
        aria-label="Placement"
        value={placement}
        onChange={e => setPlacement(e.target.value as 'after' | 'before')}
        className="rounded border border-gray-300 bg-white px-1 py-0.5"
      >
        <option value="after">after</option>
        <option value="before">before</option>
      </select>
      <input
        autoFocus
        aria-label="Line number"
        placeholder="e.g. 3.1.40"
        value={target}
        onChange={e => { setTarget(e.target.value); setError(null) }}
        className="w-28 rounded border border-gray-300 bg-white px-2 py-0.5 font-mono"
      />
      <button type="submit" className="rounded bg-blue-600 px-2 py-0.5 text-white hover:bg-blue-700">
        Move
      </button>
      <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-700">
        Cancel
      </button>
      {error && <span role="alert" className="w-full text-red-600">{error}</span>}
    </form>
  )
}
