import _ from 'lodash'
import { sortLines } from '../../../../utils/playScriptUtils'
import { isLineCut } from '../../utils/scriptUtils'
import type { PartLine, PartText } from './types'

type IndexedLine = PartLine & { _idx: number }

interface PartScriptTextContainerProps {
  characterIds: number[]
  name: string
  setShowCut: (v: boolean) => void
  showCut: boolean
  text: PartText
}

export default function PartScriptTextContainer({
  characterIds,
  name,
  setShowCut,
  showCut,
  text,
}: PartScriptTextContainerProps) {
  function ellide(content: string): string {
    const words = content.split(' ')
    const ellipsis = words.length >= 3 ? '...' : ''
    return `${ellipsis}${words.slice(-3).join(' ')}`
  }

  // Finds the nearest preceding cue/context line for an actor's line.
  // Returns undefined in some recursive branches (faithful port of original — _.compact handles it).
  function findClosestUncutText(
    i: number,
    lineIndex: number,
    lines: IndexedLine[]
  ): PartLine | null | undefined {
    const testLine = lines[lineIndex - i]
    if (!testLine) return undefined

    const characterId = testLine.character_id
    if (characterId != null && characterIds.includes(characterId)) {
      return null
    }
    if (testLine.number.match(/^SD/)) {
      return testLine
    }
    if (!showCut && isLineCut(testLine as { new_content: string | null })) {
      return null
    }
    if (!showCut && testLine.new_content) {
      return { ...testLine, new_content: ellide(testLine.new_content) }
    }
    if (!testLine.new_content) {
      return { ...testLine, original_content: ellide(testLine.original_content) }
    }
    if (characterId !== lines[lineIndex].character_id) {
      return testLine
    }

    const next = i + 1
    if (lineIndex - next < 0) {
      return undefined
    }
    // intentional: missing return mirrors original behaviour; _.compact handles undefined
    findClosestUncutText(next, lineIndex, lines)
  }

  function orderText(t: PartText): PartLine[] {
    let bucket: PartLine[] = [
      ...t.lines,
      ...t.stage_directions,
      ...t.sound_cues,
    ].filter(l => !l.original_content.match(/^$/))

    if (!showCut) {
      bucket = bucket.filter(l => {
        if (l.new_content != null) {
          return !isLineCut(l as { new_content: string | null })
        }
        return true
      })
    }

    return sortLines(bucket as Parameters<typeof sortLines>[0]) as PartLine[]
  }

  if (!text.lines || text.lines.length === 0) {
    return <div>No text selected</div>
  }

  const ordered = orderText(text)
  const indexed: IndexedLine[] = ordered.map((l, i) => ({ ...l, _idx: i }))

  const characterLines: IndexedLine[] = _.compact(
    indexed.map(l => (characterIds.includes(l.character_id ?? -1) ? l : undefined))
  )

  const nonCharacterLines: PartLine[] = _.compact(
    characterLines.map(cl => {
      if (indexed[cl._idx - 1]?.character_id === cl.character_id) return undefined
      return findClosestUncutText(1, cl._idx, indexed)
    })
  )

  const culled = sortLines(
    [...characterLines, ...nonCharacterLines] as Parameters<typeof sortLines>[0]
  ) as PartLine[]

  let currentCharId: number | null | undefined = undefined

  const lineItems = culled.map((line, index) => {
    const showCharacter = !!(line.character_id && line.character_id !== currentCharId)
    if (line.character_id) currentCharId = line.character_id

    const isTarget = characterIds.includes(line.character_id ?? -1)
    const content =
      showCut && line.new_content?.trim()
        ? `[${line.original_content} → ${line.new_content}]`
        : line.new_content?.trim() || line.original_content

    return (
      <div
        key={index}
        className={`flex gap-3 py-0.5 text-sm ${isTarget ? '' : 'opacity-50 italic'}`}
      >
        <span className="text-gray-300 w-10 shrink-0 text-right text-xs pt-0.5">
          {line.number}
        </span>
        <span className="w-28 shrink-0 text-right text-xs font-medium text-gray-600">
          {showCharacter ? (line.character?.name ?? '') : ''}
        </span>
        <span className="flex-1">{content}</span>
      </div>
    )
  })

  return (
    <>
      <h3 className="text-base font-semibold mb-2">Part Script for {name}</h3>
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="mb-2 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
      >
        Back to top
      </button>
      <div className="mb-2">
        <button
          onClick={() => setShowCut(!showCut)}
          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
        >
          {showCut ? 'Hide' : 'Show'} Text Cuts
        </button>
      </div>
      <div className="font-mono">{lineItems}</div>
    </>
  )
}
