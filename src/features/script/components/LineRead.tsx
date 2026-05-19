import { useMemo } from 'react'
import { buildDiff, isLineCut } from '../utils/scriptUtils'
import type { ScriptLine } from '../types/script'

interface LineReadProps {
  line: ScriptLine
  showCharacter: boolean
  showCut: boolean
}

export function LineRead({ line, showCharacter, showCut }: LineReadProps) {
  const isStageDirection = line.number?.match(/^SD/)
  const isCut = isLineCut(line)

  const diffContent = useMemo(() => {
    if (!showCut || !line.new_content || !line.new_content.trim()) return null
    return buildDiff(line.original_content, line.new_content)
  }, [line.original_content, line.new_content, showCut])

  if (isCut && !showCut) return null

  return (
    <div
      className={`flex gap-3 py-1 text-sm ${
        isCut && showCut ? 'opacity-50' : ''
      } ${isStageDirection ? 'italic text-gray-500' : ''}`}
    >
      <span className="text-gray-300 w-10 shrink-0 text-right text-xs pt-0.5">
        {line.number}
      </span>
      {showCharacter && line.character ? (
        <span className="font-semibold text-gray-700 w-24 shrink-0 text-right pr-2">
          {line.character.name}
        </span>
      ) : (
        <span className="w-24 shrink-0" />
      )}
      <span className="flex-1 leading-relaxed">
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
    </div>
  )
}
