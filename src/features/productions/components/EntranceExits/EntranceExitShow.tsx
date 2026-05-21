import { useState, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import type { EntranceExit, EntranceExitUpdatePayload } from '../../types/entranceExit'
import type { PlayCharacter } from '../../../plays/types/play'
import type { StageExit } from '../../types/stageExit'

interface EntranceExitShowProps {
  entranceExit: EntranceExit
  characters: PlayCharacter[]
  stageExits: StageExit[]
  isAdmin: boolean
  onUpdate: (data: EntranceExitUpdatePayload) => void
  onDelete: (id: number) => void
  isUpdating?: boolean
  isDeleting?: boolean
}

export function EntranceExitShow({
  entranceExit,
  characters,
  stageExits,
  isAdmin,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting,
}: EntranceExitShowProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editCharacterIds, setEditCharacterIds] = useState<number[]>([])
  const [editStageExitId, setEditStageExitId] = useState<number>(entranceExit.stage_exit_id)
  const cancelRef = useRef(false)

  function openSimpleField(field: string, value: string) {
    setEditingField(field)
    setEditValue(value)
  }

  function openCharacters() {
    setEditCharacterIds(entranceExit.characters.map(c => c.id))
    setEditingField('characters')
  }

  function openStageExit() {
    setEditStageExitId(entranceExit.stage_exit_id)
    setEditingField('stage_exit')
  }

  function handleEscape() {
    cancelRef.current = true
    setEditingField(null)
  }

  function handleSimpleBlur(getValue: () => EntranceExitUpdatePayload) {
    if (cancelRef.current) {
      cancelRef.current = false
      return
    }
    onUpdate(getValue())
    setEditingField(null)
  }

  function handleSimpleEnter(
    e: React.KeyboardEvent,
    getValue: () => EntranceExitUpdatePayload
  ) {
    if (e.key === 'Enter') {
      onUpdate(getValue())
      setEditingField(null)
    } else if (e.key === 'Escape') {
      handleEscape()
    }
  }

  const inputClass =
    'w-full px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  const cellClass = `px-3 py-2 text-sm ${isDeleting ? 'opacity-50' : ''}`
  const clickableCellClass = isAdmin ? 'cursor-pointer hover:bg-blue-50' : ''

  return (
    <tr className={`group border-b border-gray-100 hover:bg-gray-50 ${isUpdating ? 'opacity-60' : ''}`}>
      {/* Line */}
      <td className={`${cellClass} ${clickableCellClass}`}>
        {editingField === 'line' ? (
          <input
            type="number"
            autoFocus
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={() =>
              handleSimpleBlur(() => ({
                id: entranceExit.id,
                line: editValue === '' ? null : Number(editValue),
              }))
            }
            onKeyDown={e =>
              handleSimpleEnter(e, () => ({
                id: entranceExit.id,
                line: editValue === '' ? null : Number(editValue),
              }))
            }
            className={inputClass}
            style={{ width: '5rem' }}
          />
        ) : (
          <span
            onClick={() =>
              isAdmin && openSimpleField('line', String(entranceExit.line ?? ''))
            }
          >
            {entranceExit.line ?? '—'}
          </span>
        )}
      </td>

      {/* Page */}
      <td className={`${cellClass} ${clickableCellClass}`}>
        {editingField === 'page' ? (
          <input
            type="number"
            autoFocus
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={() =>
              handleSimpleBlur(() => ({
                id: entranceExit.id,
                page: editValue === '' ? null : Number(editValue),
              }))
            }
            onKeyDown={e =>
              handleSimpleEnter(e, () => ({
                id: entranceExit.id,
                page: editValue === '' ? null : Number(editValue),
              }))
            }
            className={inputClass}
            style={{ width: '5rem' }}
          />
        ) : (
          <span
            onClick={() =>
              isAdmin && openSimpleField('page', String(entranceExit.page ?? ''))
            }
          >
            {entranceExit.page ?? '—'}
          </span>
        )}
      </td>

      {/* Characters */}
      <td className={`${cellClass} ${isAdmin ? 'cursor-pointer hover:bg-blue-50' : ''}`}>
        {editingField === 'characters' ? (
          <select
            multiple
            autoFocus
            value={editCharacterIds.map(String)}
            onChange={e => {
              const selected = Array.from(e.target.selectedOptions).map(o =>
                Number(o.value)
              )
              setEditCharacterIds(selected)
            }}
            onBlur={() => {
              if (cancelRef.current) {
                cancelRef.current = false
                return
              }
              onUpdate({ id: entranceExit.id, character_ids: editCharacterIds })
              setEditingField(null)
            }}
            onKeyDown={e => {
              if (e.key === 'Escape') handleEscape()
            }}
            size={Math.min(characters.length, 5)}
            className={inputClass}
          >
            {characters.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : (
          <span onDoubleClick={() => isAdmin && openCharacters()}>
            {entranceExit.characters.map(c => c.name).join(', ') || '—'}
          </span>
        )}
      </td>

      {/* Category */}
      <td className={`${cellClass} ${clickableCellClass}`}>
        {editingField === 'category' ? (
          <select
            autoFocus
            defaultValue={entranceExit.category}
            onChange={e => {
              const category = e.target.value as 'Enter' | 'Exit'
              onUpdate({ id: entranceExit.id, category })
              setEditingField(null)
            }}
            onKeyDown={e => {
              if (e.key === 'Escape') handleEscape()
            }}
            className={inputClass}
          >
            <option value="Enter">Enter</option>
            <option value="Exit">Exit</option>
          </select>
        ) : (
          <span
            onClick={() =>
              isAdmin && openSimpleField('category', entranceExit.category)
            }
          >
            {entranceExit.category}
          </span>
        )}
      </td>

      {/* Stage Exit */}
      <td className={`${cellClass} ${isAdmin ? 'cursor-pointer hover:bg-blue-50' : ''}`}>
        {editingField === 'stage_exit' ? (
          <select
            autoFocus
            value={String(editStageExitId)}
            onChange={e => setEditStageExitId(Number(e.target.value))}
            onBlur={() => {
              if (cancelRef.current) {
                cancelRef.current = false
                return
              }
              onUpdate({ id: entranceExit.id, stage_exit_id: editStageExitId })
              setEditingField(null)
            }}
            onKeyDown={e => {
              if (e.key === 'Escape') handleEscape()
            }}
            className={inputClass}
          >
            {stageExits.map(se => (
              <option key={se.id} value={se.id}>
                {se.name}
              </option>
            ))}
          </select>
        ) : (
          <span onDoubleClick={() => isAdmin && openStageExit()}>
            {entranceExit.stage_exit?.name ?? '—'}
          </span>
        )}
      </td>

      {/* Notes */}
      <td className={`${cellClass} ${clickableCellClass}`}>
        {editingField === 'notes' ? (
          <textarea
            autoFocus
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={() =>
              handleSimpleBlur(() => ({
                id: entranceExit.id,
                notes: editValue === '' ? null : editValue,
              }))
            }
            onKeyDown={e =>
              handleSimpleEnter(e, () => ({
                id: entranceExit.id,
                notes: editValue === '' ? null : editValue,
              }))
            }
            rows={2}
            className={inputClass}
          />
        ) : (
          <span
            onClick={() =>
              isAdmin && openSimpleField('notes', entranceExit.notes ?? '')
            }
          >
            {entranceExit.notes ?? '—'}
          </span>
        )}
      </td>

      {/* Delete */}
      <td className={cellClass}>
        {isAdmin && (
          <button
            onClick={() => onDelete(entranceExit.id)}
            disabled={isDeleting}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity disabled:opacity-50 p-1"
            aria-label="Delete entrance/exit"
          >
            <Trash2 size={14} />
          </button>
        )}
      </td>
    </tr>
  )
}
