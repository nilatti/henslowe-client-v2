import { useState } from 'react'
import { useUpdateLine } from '../api/script'
import { buildDiff, isLineCut } from '../utils/scriptUtils'
import type { ScriptLine } from '../types/script'

interface LineEditableProps {
  line: ScriptLine
  showCharacter: boolean
  showCut: boolean
  playId: number
  characters: { id: number; name: string }[]
}

export function LineEditable({
  line,
  showCharacter,
  showCut,
  playId,
  characters,
}: LineEditableProps) {
  const updateLine = useUpdateLine(playId)
  const [editOpen, setEditOpen] = useState(false)
  const [charSelectOpen, setCharSelectOpen] = useState(false)
  // Initialize to the editable version: new_content if non-cut, else original
  const [editValue, setEditValue] = useState(
    line.new_content?.trim() ? line.new_content : line.original_content
  )
  const [pendingCharId, setPendingCharId] = useState<number | null>(
    line.character_id
  )

  const isCut = isLineCut(line)
  const isStageDirection = !!line.number?.match(/^SD/)

  const diffContent =
    showCut && line.new_content?.trim()
      ? buildDiff(line.original_content, line.new_content)
      : null

  const handleCut = () => updateLine.mutate({ ...line, new_content: ' ' })
  const handleRestore = () => updateLine.mutate({ ...line, new_content: '' })

  const handleLineSubmit = () => {
    if (editValue !== (line.new_content ?? line.original_content)) {
      updateLine.mutate({ ...line, new_content: editValue })
    }
    setEditOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLineSubmit()
    if (e.key === 'Escape') {
      setEditValue(line.new_content?.trim() ? line.new_content : line.original_content)
      setEditOpen(false)
    }
  }

  const handleCharSelectBlur = () => {
    if (pendingCharId !== line.character_id) {
      const character = characters.find(c => c.id === pendingCharId) ?? null
      updateLine.mutate({ ...line, character_id: pendingCharId, character })
    }
    setCharSelectOpen(false)
  }

  const handleCharSelectKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setPendingCharId(line.character_id)
      setCharSelectOpen(false)
    }
  }

  if (isCut && !showCut) return null

  return (
    <div
      className={`flex gap-3 py-1 text-sm group ${
        isCut && showCut ? 'opacity-40' : ''
      } ${isStageDirection ? 'italic text-gray-500' : ''}`}
    >
      <span className="text-gray-300 w-10 shrink-0 text-right text-xs pt-0.5">
        {line.number}
      </span>

      {/* Character name / selector */}
      <div className="relative w-24 shrink-0 text-right pr-2">
        {charSelectOpen ? (
          <select
            autoFocus
            size={Math.min(characters.length + 1, 6)}
            className="text-xs border border-gray-300 rounded shadow-lg absolute right-0 top-0 z-10 bg-white min-w-max"
            value={pendingCharId ?? ''}
            onChange={e => setPendingCharId(Number(e.target.value) || null)}
            onBlur={handleCharSelectBlur}
            onKeyDown={handleCharSelectKeyDown}
          >
            <option value="">None</option>
            {characters.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : showCharacter && line.character ? (
          <span
            className="font-semibold text-gray-700 cursor-pointer hover:text-blue-600 text-xs"
            onDoubleClick={() => {
              setPendingCharId(line.character_id)
              setCharSelectOpen(true)
            }}
            title="Double-click to reassign"
          >
            {line.character.name}
          </span>
        ) : (
          <span
            className="text-gray-300 text-xs cursor-pointer hover:text-blue-400 select-none"
            onDoubleClick={() => {
              setPendingCharId(line.character_id)
              setCharSelectOpen(true)
            }}
            title="Double-click to set character"
          >
            {line.character_id ? '·' : ''}
          </span>
        )}
      </div>

      {/* Line text / edit input */}
      <div className="flex-1 min-w-0">
        {editOpen ? (
          <input
            autoFocus
            value={editValue ?? ''}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleLineSubmit}
            className="w-full px-2 py-0.5 border border-blue-400 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
        ) : (
          <span
            className="leading-relaxed cursor-text"
            onDoubleClick={() => {
              setEditValue(line.new_content?.trim() ? line.new_content : line.original_content)
              setEditOpen(true)
            }}
            title="Double-click to edit"
          >
            {diffContent ? (
              diffContent.map((part, i) => (
                <span
                  key={i}
                  className={
                    part.type === 'removed'
                      ? 'line-through text-red-400'
                      : part.type === 'added'
                      ? 'text-green-600 font-medium'
                      : ''
                  }
                >
                  {part.value}
                </span>
              ))
            ) : line.new_content?.trim() ? (
              line.new_content
            ) : (
              line.original_content
            )}
          </span>
        )}
      </div>

      {/* Cut / Restore — visible on hover */}
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {isCut ? (
          <button
            onClick={handleRestore}
            className="text-xs px-2 py-0.5 border border-green-400 text-green-600 rounded hover:bg-green-50"
          >
            Restore
          </button>
        ) : (
          <button
            onClick={handleCut}
            className="text-xs px-2 py-0.5 border border-red-300 text-red-500 rounded hover:bg-red-50"
          >
            Cut
          </button>
        )}
      </div>
    </div>
  )
}
