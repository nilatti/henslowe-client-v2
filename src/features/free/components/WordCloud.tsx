import { useState, useMemo } from 'react'
import { useFreePlayStore } from '../store/freePlayStore'
import { SelectPlay } from './SelectPlay'
import { LoadingSpinner } from '../../../components/ui'
import {
  getFrenchScenesFromPlay,
  getFrenchScenesFromAct,
  mergeTextFromFrenchScenes,
  getLinesForCharacter,
  returnWordsFromLines,
  getScenesFromPlay,
} from '../../../utils/playScriptUtils'
import type { PlayScript } from '../../script/types/script'
import { Suspense } from 'react'

interface WordEntry {
  text: string
  value: number
  include: boolean
}

interface ContextItem {
  type?: 'play' | 'act' | 'scene' | 'french_scene'
  id: number
  label?: string
  name?: string
  isSelected?: boolean
}

type UtilPlay = Parameters<typeof getFrenchScenesFromPlay>[0]
type UtilAct = Parameters<typeof getFrenchScenesFromAct>[0]

function getWordsForContext(item: ContextItem, play: PlayScript): { originalContent: WordEntry[]; newContent: WordEntry[] } {
  if (item.type === 'play') {
    const frenchScenes = getFrenchScenesFromPlay(play as unknown as UtilPlay)
    const text = mergeTextFromFrenchScenes(frenchScenes)
    return returnWordsFromLines(text.lines as Parameters<typeof returnWordsFromLines>[0])
  } else if (item.type === 'act') {
    const act = play.acts.find(a => a.id === item.id)
    if (!act) return { originalContent: [], newContent: [] }
    const frenchScenes = getFrenchScenesFromAct(act as unknown as UtilAct)
    const text = mergeTextFromFrenchScenes(frenchScenes)
    return returnWordsFromLines(text.lines as Parameters<typeof returnWordsFromLines>[0])
  } else if (item.type === 'scene') {
    const scenes = getScenesFromPlay(play as unknown as UtilPlay)
    const scene = scenes.find(s => (s as unknown as { id: number }).id === item.id)
    if (!scene) return { originalContent: [], newContent: [] }
    const text = mergeTextFromFrenchScenes(scene.french_scenes)
    return returnWordsFromLines(text.lines as Parameters<typeof returnWordsFromLines>[0])
  } else if (item.type === 'french_scene') {
    const scenes = getScenesFromPlay(play as unknown as UtilPlay)
    for (const scene of scenes) {
      const fs = (scene.french_scenes as unknown as Array<{ id: number; lines: unknown[] }>).find(f => f.id === item.id)
      if (fs) {
        return returnWordsFromLines(fs.lines as Parameters<typeof returnWordsFromLines>[0])
      }
    }
    return { originalContent: [], newContent: [] }
  } else {
    // character
    const frenchScenes = getFrenchScenesFromPlay(play as unknown as UtilPlay)
    const text = mergeTextFromFrenchScenes(frenchScenes)
    const characterLines = getLinesForCharacter(text.lines as Parameters<typeof getLinesForCharacter>[0], item.id)
    return returnWordsFromLines(characterLines as Parameters<typeof returnWordsFromLines>[0])
  }
}

function WordFrequencyTable({ words, title }: { words: WordEntry[]; title: string }) {
  const top = words.filter(w => w.include).slice(0, 50)
  if (!top.length) return null
  return (
    <div className="mr-6">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <div className="flex flex-wrap gap-1 max-w-sm">
        {top.map(w => (
          <span
            key={w.text}
            className="inline-block px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-xs"
            style={{ fontSize: `${Math.max(10, Math.min(24, 10 + w.value * 0.5))}px` }}
          >
            {w.text}
          </span>
        ))}
      </div>
    </div>
  )
}

function WordCloudPresenter({ context, play }: { context: ContextItem[]; play: PlayScript }) {
  const results = useMemo(
    () => context.map(item => ({ item, words: getWordsForContext(item, play) })),
    [context, play]
  )

  return (
    <div className="space-y-8">
      {results.map((r, i) => (
        <div key={i} className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {r.item.label ?? r.item.name}
          </h3>
          <div className="flex flex-wrap gap-6">
            <WordFrequencyTable words={r.words.originalContent} title="Original text" />
            {r.words.newContent.some(w => w.value > 0) && (
              <WordFrequencyTable words={r.words.newContent} title="Cut text" />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function WordCloudSelector({
  play,
  onSubmit,
}: {
  play: PlayScript
  onSubmit: (items: ContextItem[]) => void
}) {
  type AnyRecord = Record<string, unknown>
  const acts = play.acts
  const scenes = getScenesFromPlay(play as unknown as Parameters<typeof getScenesFromPlay>[0]) as unknown as AnyRecord[]
  const frenchScenes = scenes.flatMap(s => (s.french_scenes as unknown as AnyRecord[]) ?? [])

  const contentItems: ContextItem[] = [
    { type: 'play', id: play.id, label: 'Whole Play' },
    ...acts.map(a => ({ type: 'act' as const, id: a.id, label: `Act ${a.number}` })),
    ...scenes.map(s => ({ type: 'scene' as const, id: Number(s.id), label: String(s.pretty_name ?? '') })),
    ...frenchScenes.map(fs => ({ type: 'french_scene' as const, id: Number(fs.id), label: String(fs.pretty_name ?? '') })),
  ]

  const [selectedContent, setSelectedContent] = useState<Set<string>>(new Set())
  const [selectedChars, setSelectedChars] = useState<Set<number>>(new Set())

  function toggleContent(key: string) {
    setSelectedContent(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function toggleChar(id: number) {
    setSelectedChars(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleSubmit() {
    const chosen: ContextItem[] = []
    contentItems.forEach(item => {
      if (selectedContent.has(`${item.type}-${item.id}`)) {
        chosen.push(item)
      }
    })
    play.characters.forEach(c => {
      if (selectedChars.has(c.id)) {
        chosen.push({ id: c.id, name: c.name })
      }
    })
    onSubmit(chosen)
  }

  const ready = selectedContent.size > 0 || selectedChars.size > 0

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Select Characters (optional)</h3>
        <div className="flex flex-wrap gap-2">
          {play.characters.map(c => (
            <label key={c.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selectedChars.has(c.id)}
                onChange={() => toggleChar(c.id)}
                className="rounded"
              />
              {c.name}
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Select Content (optional)</h3>
        <div className="flex flex-wrap gap-2">
          {contentItems.map(item => {
            const key = `${item.type}-${item.id}`
            return (
              <label key={key} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedContent.has(key)}
                  onChange={() => toggleContent(key)}
                  className="rounded"
                />
                {item.label}
              </label>
            )
          })}
        </div>
      </div>
      <button
        disabled={!ready}
        onClick={handleSubmit}
        className="px-4 py-2 bg-blue-600 text-white text-sm rounded disabled:opacity-50 hover:bg-blue-700"
      >
        {ready ? 'Generate Word Clouds' : 'Select at least one character or section'}
      </button>
    </div>
  )
}

export function WordCloud() {
  const { loading, play, setPlay } = useFreePlayStore()
  const [context, setContext] = useState<ContextItem[] | null>(null)
  const [selectOpen, setSelectOpen] = useState(false)

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
      <h2 className="text-xl font-semibold mb-3">Word Cloud for {play.title}</h2>
      <button
        onClick={() => setPlay(null)}
        className="mb-4 px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50"
      >
        Select a different play
      </button>

      {context && !selectOpen ? (
        <>
          <button
            onClick={() => setSelectOpen(true)}
            className="mb-4 px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50"
          >
            Select content to word cloud
          </button>
          <WordCloudPresenter context={context} play={play} />
        </>
      ) : (
        <WordCloudSelector
          play={play}
          onSubmit={items => {
            setContext(items)
            setSelectOpen(false)
          }}
        />
      )}
    </>
  )
}
