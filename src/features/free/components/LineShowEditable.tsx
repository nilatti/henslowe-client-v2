import { useState } from 'react'
import * as DiffLib from 'diff'
import { CharacterSelect } from './CharacterSelect'
import { isCut as isLineCut } from '../../../utils/playScriptUtils'
import type { ScriptLine } from '../../script/types/script'

interface LineShowEditableProps {
  line: ScriptLine
  index: number
  showCharacter: boolean
  showCut: boolean
  handleLineSubmit: (line: ScriptLine) => void
}

interface LineEditFormProps {
  line: ScriptLine
  onSubmit: (line: ScriptLine) => void
}

function LineEditForm({ line, onSubmit }: LineEditFormProps) {
  const [value, setValue] = useState(line.new_content?.trim() ? line.new_content : line.original_content)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ ...line, new_content: value })
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 flex-1">
      <input
        autoFocus
        value={value ?? ''}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Escape') onSubmit(line)
        }}
        className="flex-1 px-2 py-0.5 border border-blue-400 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
      />
      <button
        type="submit"
        className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded"
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => onSubmit(line)}
        className="px-2 py-0.5 border border-gray-300 text-xs rounded"
      >
        Cancel
      </button>
    </form>
  )
}

function buildDiffContent(original: string, newContent: string) {
  return DiffLib.diffWordsWithSpace(original, newContent).map(part => ({
    type: part.added ? 'added' : part.removed ? 'removed' : 'unchanged',
    value: part.value,
  }))
}

export function LineShowEditable({
  line,
  index,
  showCharacter,
  showCut,
  handleLineSubmit,
}: LineShowEditableProps) {
  const tempSelectedCharacter = line.character
    ? [{ id: line.character.id, name: line.character.name }]
    : []

  const [characterSelectOpen, setCharacterSelectOpen] = useState(false)
  const [editFormOpen, setEditFormOpen] = useState(false)
  const [selectedCharacter] = useState(tempSelectedCharacter)

  const isCut = isLineCut(line)
  const isStageDirection = !!line.number?.match(/^SD/)

  const diffContent =
    showCut && line.new_content?.trim()
      ? buildDiffContent(line.original_content, line.new_content)
      : null

  const lineText: React.ReactNode = diffContent
    ? diffContent.map((part, i) => (
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
    : (line.new_content?.trim() ? line.new_content : line.original_content)

  function handleCutWholeLine() {
    handleLineSubmit({ ...line, new_content: '' })
  }

  function handleUnCutWholeLine() {
    handleLineSubmit({ ...line, new_content: null })
  }

  function submitCharacterEdit(newCharacter: { id: number; name: string }[]) {
    setCharacterSelectOpen(false)
    handleLineSubmit({
      ...line,
      character_id: newCharacter[0]?.id ?? null,
      character: newCharacter[0] ? { id: newCharacter[0].id, name: newCharacter[0].name } : null,
    })
  }

  function submitLineEdit(updated: ScriptLine) {
    setEditFormOpen(false)
    handleLineSubmit(updated)
  }

  let characterComponent: React.ReactNode
  if (characterSelectOpen) {
    characterComponent = (
      <CharacterSelect
        onBlur={submitCharacterEdit}
        selectedCharacter={selectedCharacter}
      />
    )
  } else if (showCharacter && line.character) {
    characterComponent = (
      <span
        className="font-semibold text-gray-700 text-xs cursor-pointer hover:text-blue-600"
        onDoubleClick={() => setCharacterSelectOpen(true)}
        title="Double-click to reassign"
      >
        {line.character.name}
      </span>
    )
  } else if (line.character_id) {
    characterComponent = (
      <span
        className="text-gray-300 text-xs cursor-pointer hover:text-blue-400 select-none"
        onDoubleClick={() => setCharacterSelectOpen(true)}
        title="Double-click to reassign"
      >·</span>
    )
  } else {
    characterComponent = (
      <span
        className="text-gray-400 text-xs cursor-pointer hover:text-blue-500 select-none italic"
        onDoubleClick={() => setCharacterSelectOpen(true)}
        title="Double-click to set character"
      >
        Set character
      </span>
    )
  }

  return (
    <div
      className={`flex gap-3 py-1 text-sm ${
        isCut && showCut ? 'opacity-40' : ''
      } ${isStageDirection ? 'italic text-gray-500' : ''} ${
        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
      }`}
    >
      <span className="text-gray-400 w-16 shrink-0 text-right text-xs pt-0.5">
        {line.number}
      </span>

      <div className="relative w-40 shrink-0 text-left pl-2">
        {characterComponent}
      </div>

      <div className="flex-1 min-w-0">
        {editFormOpen ? (
          <LineEditForm line={line} onSubmit={submitLineEdit} />
        ) : (
          <span
            className="leading-relaxed cursor-text"
            onDoubleClick={() => setEditFormOpen(true)}
            title="Double-click to edit"
          >
            {lineText}
          </span>
        )}
      </div>

      <div className="shrink-0">
        {isCut ? (
          <button
            onClick={handleUnCutWholeLine}
            className="text-xs px-2 py-0.5 border border-cyan-500 text-cyan-600 rounded hover:bg-cyan-50"
          >
            Un-Cut Whole Line
          </button>
        ) : (
          <button
            onClick={handleCutWholeLine}
            className="text-xs px-2 py-0.5 bg-cyan-500 text-white rounded hover:bg-cyan-600"
          >
            Cut Whole Line
          </button>
        )}
      </div>
    </div>
  )
}
