import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import {
  getFrenchScenesFromPlay,
  mergeTextFromFrenchScenes,
} from '../../../../utils/playScriptUtils'
import { generateCutPartScript, generateMarkedPartScript } from '../../utils/exportScript'
import type { PlayScript } from '../../types/script'
import type { ActorWithJobs, PartText } from './types'
import { buildUserName, type User } from '../../../../utils/actorUtils'

interface PartEntry {
  key: string
  label: string
  characterIds: number[]
}

interface PartScriptExportButtonsProps {
  play: PlayScript
  actors: ActorWithJobs[]
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function PartScriptExportButtons({ play, actors }: PartScriptExportButtonsProps) {
  const [selectedKey, setSelectedKey] = useState('')
  const [cutLoading, setCutLoading] = useState(false)
  const [markedLoading, setMarkedLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const entries = useMemo<PartEntry[]>(() => {
    const result: PartEntry[] = []
    const coveredCharIds = new Set<number>()

    for (const actor of actors) {
      const charIds = actor.jobs.map(j => j.character_id)
      if (!charIds.length) continue
      const charNames = charIds
        .map(id => play.characters.find(c => c.id === id)?.name)
        .filter(Boolean)
        .join(', ')
      const label = `${buildUserName(actor as User)} (${charNames})`
      result.push({ key: `actor-${actor.id}`, label, characterIds: charIds })
      charIds.forEach(id => coveredCharIds.add(id))
    }

    for (const char of play.characters) {
      if (coveredCharIds.has(char.id)) continue
      result.push({
        key: `char-${char.id}`,
        label: char.name,
        characterIds: [char.id],
      })
    }

    return result
  }, [play, actors])

  const text = useMemo<PartText>(() => {
    const frenchScenes = getFrenchScenesFromPlay(
      play as Parameters<typeof getFrenchScenesFromPlay>[0]
    )
    return mergeTextFromFrenchScenes(frenchScenes) as unknown as PartText
  }, [play])

  const selected = entries.find(e => e.key === selectedKey)
  const safeTitle = play.title.replace(/[^a-zA-Z0-9_-]/g, '_')

  async function handleDownload(marked: boolean) {
    if (!selected) return
    const safeName = selected.label.replace(/[^a-zA-Z0-9_-]/g, '_')
    const setLoading = marked ? setMarkedLoading : setCutLoading
    setLoading(true)
    setError(null)
    try {
      const blob = marked
        ? await generateMarkedPartScript(text, selected.characterIds, selected.label, play.title)
        : await generateCutPartScript(text, selected.characterIds, selected.label, play.title)
      const suffix = marked ? 'marked' : 'cut'
      triggerDownload(blob, `${safeTitle}_part_script_${safeName}_${suffix}.docx`)
    } catch {
      setError('Failed to generate part script.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedKey}
          onChange={e => setSelectedKey(e.target.value)}
          className="px-2 py-1.5 border border-gray-300 rounded text-sm"
        >
          <option value="">Select actor or character…</option>
          {entries.map(e => (
            <option key={e.key} value={e.key}>
              {e.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => handleDownload(false)}
          disabled={!selected || cutLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {cutLoading ? (
            <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download Cut Part Script
        </button>

        <button
          onClick={() => handleDownload(true)}
          disabled={!selected || markedLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {markedLoading ? (
            <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download Marked Part Script
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
