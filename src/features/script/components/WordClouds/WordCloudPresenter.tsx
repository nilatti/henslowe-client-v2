import { useRef } from 'react'
import ComparisonContainer from './ComparisonContainer'
import {
  getFrenchScenesFromPlay,
  getFrenchScenesFromAct,
  mergeTextFromFrenchScenes,
  getLinesForCharacter,
  returnWordsFromLines,
} from '../../../../utils/playScriptUtils'
import type { PlayScript, ScriptFrenchScene, ScriptScene } from '../../types/script'
import type { WordCloudContextItem, WordLines } from './types'

interface ContextEntry {
  item: WordCloudContextItem
  lines: WordLines
}

function buildWordLines(item: WordCloudContextItem, play: PlayScript): WordLines {
  const empty: WordLines = { originalContent: [], newContent: [] }

  if (item.type === 'play') {
    const frenchScenes = getFrenchScenesFromPlay(
      play as Parameters<typeof getFrenchScenesFromPlay>[0]
    )
    const text = mergeTextFromFrenchScenes(frenchScenes)
    return returnWordsFromLines(
      text.lines as Parameters<typeof returnWordsFromLines>[0]
    ) as WordLines
  }

  if (item.type === 'act') {
    const act = play.acts.find(a => a.id === item.id)
    if (!act) return empty
    const frenchScenes = getFrenchScenesFromAct(
      act as Parameters<typeof getFrenchScenesFromAct>[0]
    )
    const text = mergeTextFromFrenchScenes(frenchScenes)
    return returnWordsFromLines(
      text.lines as Parameters<typeof returnWordsFromLines>[0]
    ) as WordLines
  }

  if (item.type === 'scene') {
    let found: ScriptScene | undefined
    for (const act of play.acts) {
      found = act.scenes.find(s => s.id === item.id)
      if (found) break
    }
    if (!found) return empty
    const text = mergeTextFromFrenchScenes(
      found.french_scenes as unknown as Parameters<typeof mergeTextFromFrenchScenes>[0]
    )
    return returnWordsFromLines(
      text.lines as Parameters<typeof returnWordsFromLines>[0]
    ) as WordLines
  }

  if (item.type === 'french_scene') {
    let found: ScriptFrenchScene | undefined
    outer: for (const act of play.acts) {
      for (const scene of act.scenes) {
        found = scene.french_scenes.find(fs => fs.id === item.id)
        if (found) break outer
      }
    }
    if (!found) return empty
    return returnWordsFromLines(
      found.lines as Parameters<typeof returnWordsFromLines>[0]
    ) as WordLines
  }

  // character
  const frenchScenes = getFrenchScenesFromPlay(
    play as Parameters<typeof getFrenchScenesFromPlay>[0]
  )
  const text = mergeTextFromFrenchScenes(frenchScenes)
  const charLines = getLinesForCharacter(
    text.lines as Parameters<typeof getLinesForCharacter>[0],
    item.id
  )
  return returnWordsFromLines(
    charLines as Parameters<typeof returnWordsFromLines>[0]
  ) as WordLines
}

interface WordCloudPresenterProps {
  context: WordCloudContextItem[]
  play: PlayScript
}

export default function WordCloudPresenter({ context, play }: WordCloudPresenterProps) {
  const elementRefs = useRef<(HTMLDivElement | null)[]>([])

  const contextArray: ContextEntry[] = context.map(item => ({
    item,
    lines: buildWordLines(item, play),
  }))

  if (!contextArray.length) {
    return <div>Loading</div>
  }

  return (
    <div>
      <ul className="flex flex-wrap gap-2 mb-4 list-none">
        {contextArray.map((entry, index) => (
          <li key={crypto.randomUUID()}>
            <button
              onClick={() =>
                elementRefs.current[index]?.scrollIntoView({ behavior: 'smooth' })
              }
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              {entry.item.label ?? entry.item.name}
            </button>
          </li>
        ))}
      </ul>
      {contextArray.map((entry, index) => (
        <div
          key={crypto.randomUUID()}
          ref={el => {
            elementRefs.current[index] = el
          }}
        >
          <ComparisonContainer context={entry} play={play} />
        </div>
      ))}
    </div>
  )
}
