import { useState } from 'react'
import { ScriptContainer } from './ScriptContainer'
import { calculateRunTime } from '../../../utils/playScriptUtils'
import type { ScriptLine, MergedText } from '../../script/types/script'

interface SelectedText {
  id?: number
  heading?: string
  pretty_name?: string
}

interface TextEditProps {
  handleLineSubmit: (line: ScriptLine) => void
  linesPerMinute: string
  selectedText: SelectedText
  text: Partial<MergedText>
}

export function TextEdit({ handleLineSubmit, linesPerMinute, selectedText, text }: TextEditProps) {
  const [showCut, setShowCut] = useState(true)

  if (!selectedText?.id) {
    return (
      <div className="flex-1 p-4 text-sm text-gray-500 italic">
        To begin, use the menu on the left to select the text you would like to
        work with.
      </div>
    )
  }

  const lpmNumber = Number(linesPerMinute)
  const runTime =
    lpmNumber > 0 && text.lines && text.lines.length > 0
      ? calculateRunTime(text.lines as Parameters<typeof calculateRunTime>[0], lpmNumber)
      : null

  return (
    <div className="flex-1 min-w-0 border-l border-gray-200 pl-8">
      <h3 className="text-base font-semibold text-gray-800 mb-2">
        {(selectedText as { heading?: string; pretty_name?: string }).heading ??
          (selectedText as { heading?: string; pretty_name?: string }).pretty_name}
      </h3>

      {runTime !== null && (
        <div className="text-xs text-gray-500 mb-3 font-medium">
          Run time at {lpmNumber} lines/min: <strong>{runTime} minutes</strong>
        </div>
      )}

      <button
        onClick={() => setShowCut(!showCut)}
        className="mb-3 px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50"
      >
        {showCut ? 'Hide' : 'Show'} Text Cuts
      </button>

      <ScriptContainer
        handleLineSubmit={handleLineSubmit}
        showCut={showCut}
        text={text}
      />
    </div>
  )
}
