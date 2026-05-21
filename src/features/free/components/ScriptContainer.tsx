import { LineShowEditable } from './LineShowEditable'
import { sortLines } from '../../../utils/playScriptUtils'
import type { ScriptLine, MergedText } from '../../script/types/script'

interface ScriptContainerProps {
  handleLineSubmit: (line: ScriptLine) => void
  showCut: boolean
  text: Partial<MergedText>
}

export function ScriptContainer({ handleLineSubmit, showCut, text }: ScriptContainerProps) {
  if (!text.lines || text.lines.length === 0) {
    return <div className="text-sm text-gray-400 italic">No text selected.</div>
  }

  let bucket = [
    ...text.lines,
    ...(text.stage_directions ?? []),
    ...(text.sound_cues ?? []),
  ].filter(l => l.original_content?.trim())

  if (!showCut) {
    bucket = bucket.filter(l => !l.new_content || l.new_content.trim() !== '')
  }

  const sorted = sortLines(bucket as Parameters<typeof sortLines>[0]) as ScriptLine[]

  let currentCharId: number | null = null
  const lineItems = sorted.map((line, i) => {
    const showCharacter = !!(line.character_id && line.character_id !== currentCharId)
    if (line.character_id) currentCharId = line.character_id

    return (
      <LineShowEditable
        key={i}
        index={i}
        line={line}
        handleLineSubmit={handleLineSubmit}
        showCharacter={showCharacter}
        showCut={showCut}
      />
    )
  })

  return <div className="font-mono text-sm">{lineItems}</div>
}
