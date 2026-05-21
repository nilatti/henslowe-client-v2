import { useState, useMemo, Suspense } from 'react'
import { useFreePlayStore } from '../store/freePlayStore'
import { SelectPlay } from './SelectPlay'
import { LoadingSpinner } from '../../../components/ui'
import {
  getFrenchScenesFromPlay,
  mergeTextFromFrenchScenes,
  sortLines,
} from '../../../utils/playScriptUtils'
import { buildUserName } from '../../../utils/actorUtils'
import type { FakeActor } from '../types/freePlay'
import type { PlayScript, ScriptLine } from '../../script/types/script'

interface PartScriptTextProps {
  characterIds: number[]
  name: string
  play: PlayScript
}

function ellide(content: string): string {
  const words = content.split(' ')
  const ellipsis = words.length >= 3 ? '…' : ''
  return `${ellipsis}${words.slice(-3).join(' ')}`
}

function PartScriptText({ characterIds, name, play }: PartScriptTextProps) {
  const [showCut, setShowCut] = useState(true)

  const lines = useMemo(() => {
    const frenchScenes = getFrenchScenesFromPlay(play as unknown as Parameters<typeof getFrenchScenesFromPlay>[0])
    const merged = mergeTextFromFrenchScenes(frenchScenes)
    let bucket = [
      ...merged.lines,
      ...merged.stage_directions,
      ...merged.sound_cues,
    ].filter(l => l.original_content?.trim())

    if (!showCut) {
      bucket = bucket.filter(l => !l.new_content || l.new_content.trim() !== '')
    }

    const sorted = sortLines(bucket as Parameters<typeof sortLines>[0]) as ScriptLine[]

    // Index sorted lines then extract character lines + context
    const indexed = sorted.map((l, i) => ({ ...l, _idx: i }))
    const charLines = indexed.filter(l => characterIds.includes(l.character_id ?? -1))

    const contextLineIds = new Set<number>()
    charLines.forEach(cl => {
      const prev = indexed[cl._idx - 1]
      if (prev && !characterIds.includes(prev.character_id ?? -1)) {
        contextLineIds.add(prev.id)
      }
    })

    const result = indexed
      .filter(l => characterIds.includes(l.character_id ?? -1) || contextLineIds.has(l.id))
      .map(l => {
        const isContext = contextLineIds.has(l.id) && !characterIds.includes(l.character_id ?? -1)
        if (isContext) {
          const content = l.new_content?.trim() || l.original_content
          return { ...l, _display: ellide(content), _isContext: true }
        }
        return { ...l, _isContext: false, _display: null }
      })

    return sortLines(result as Parameters<typeof sortLines>[0]) as (ScriptLine & { _isContext: boolean; _display: string | null })[]
  }, [play, characterIds, showCut])

  let currentCharId: number | null = null

  return (
    <div className="mb-8">
      <h3 className="text-base font-semibold text-gray-800 mb-2">Part Script for {name}</h3>
      <button
        onClick={() => setShowCut(!showCut)}
        className="mb-2 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
      >
        {showCut ? 'Hide' : 'Show'} Text Cuts
      </button>
      <div className="font-mono text-sm">
        {lines.map((line, i) => {
          const showCharacter = !!(line.character_id && line.character_id !== currentCharId)
          if (line.character_id) currentCharId = line.character_id
          const content = line._display ?? (
            showCut && line.new_content?.trim()
              ? `[${line.original_content} → ${line.new_content}]`
              : line.new_content?.trim() || line.original_content
          )

          return (
            <div
              key={i}
              className={`flex gap-3 py-0.5 ${line._isContext ? 'opacity-50 italic' : ''}`}
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
        })}
      </div>
      <hr className="mt-4" />
    </div>
  )
}

interface SelectorItem {
  type: 'actor' | 'character'
  id: number
  characterIds?: number[]
  name: string
}

function PartScriptSelector({
  actors,
  play,
  onSubmit,
}: {
  actors: FakeActor[]
  play: PlayScript
  onSubmit: (items: SelectorItem[]) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggle(key: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function handleSubmit() {
    const items: SelectorItem[] = []
    actors.forEach(a => {
      if (selected.has(`actor-${a.id}`)) {
        items.push({
          type: 'actor',
          id: a.id,
          characterIds: a.jobs.map(j => j.character_id),
          name: buildUserName(a),
        })
      }
    })
    play.characters.forEach(c => {
      if (selected.has(`char-${c.id}`)) {
        items.push({ type: 'character', id: c.id, characterIds: [c.id], name: c.name })
      }
    })
    onSubmit(items)
  }

  return (
    <div className="space-y-4">
      {actors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Actors</h3>
          <div className="flex flex-wrap gap-2">
            {actors.map(a => (
              <label key={a.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.has(`actor-${a.id}`)}
                  onChange={() => toggle(`actor-${a.id}`)}
                  className="rounded"
                />
                {buildUserName(a)}
              </label>
            ))}
          </div>
        </div>
      )}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Characters</h3>
        <div className="flex flex-wrap gap-2">
          {play.characters.map(c => (
            <label key={c.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(`char-${c.id}`)}
                onChange={() => toggle(`char-${c.id}`)}
                className="rounded"
              />
              {c.name}
            </label>
          ))}
        </div>
      </div>
      <button
        disabled={selected.size === 0}
        onClick={handleSubmit}
        className="px-4 py-2 bg-blue-600 text-white text-sm rounded disabled:opacity-50 hover:bg-blue-700"
      >
        Generate Part Scripts
      </button>
    </div>
  )
}

export function PartScripts() {
  const { fakeActorsArray, loading, play, setPlay } = useFreePlayStore()
  const [context, setContext] = useState<SelectorItem[] | null>(null)
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
      <h2 className="text-xl font-semibold mb-3">Part Scripts for {play.title}</h2>
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
            Select roles and actors
          </button>
          {context.map((item, i) => (
            <PartScriptText
              key={i}
              characterIds={item.characterIds ?? [item.id]}
              name={item.name}
              play={play}
            />
          ))}
        </>
      ) : (
        <PartScriptSelector
          actors={fakeActorsArray}
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
