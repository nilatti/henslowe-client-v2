import { useState } from 'react'
import { getScenesFromPlay } from '../../../../utils/playScriptUtils'
import type { PlayScript, ScriptScene } from '../../types/script'
import type { WordCloudContextItem } from './types'

interface ContentItem extends WordCloudContextItem {
  type: 'play' | 'act' | 'scene' | 'french_scene'
  isSelected: boolean
  label: string
}

interface CharItem {
  id: number
  name: string
  isSelected: boolean
}

interface WordCloudSelectorProps {
  play: PlayScript
  onFormSubmit: (content: WordCloudContextItem[], characters: WordCloudContextItem[]) => void
}

function formatPlayContent(play: PlayScript): ContentItem[] {
  const content: ContentItem[] = []
  const scenes = getScenesFromPlay(
    play as Parameters<typeof getScenesFromPlay>[0]
  ) as unknown as ScriptScene[]
  const frenchScenes = scenes.flatMap(s => s.french_scenes)

  content.push({ type: 'play', id: play.id, isSelected: false, label: 'Whole Play' })
  play.acts.forEach(act =>
    content.push({ type: 'act', id: act.id, isSelected: false, label: `Act ${act.number}` })
  )
  scenes.forEach(scene =>
    content.push({ type: 'scene', id: scene.id, isSelected: false, label: scene.pretty_name })
  )
  frenchScenes.forEach(fs =>
    content.push({ type: 'french_scene', id: fs.id, isSelected: false, label: fs.pretty_name })
  )

  return content
}

const unitBg: Record<string, string> = {
  play: 'bg-white border border-gray-300',
  act: 'bg-gray-700 text-white',
  scene: 'bg-gray-400',
  french_scene: 'bg-gray-200',
}

export default function WordCloudSelector({ play, onFormSubmit }: WordCloudSelectorProps) {
  const [selectedContent, setSelectedContent] = useState<ContentItem[]>(() =>
    formatPlayContent(play)
  )
  const [selectedChars, setSelectedChars] = useState<CharItem[]>(
    play.characters.map(c => ({ ...c, isSelected: false }))
  )

  function submitSelection() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    onFormSubmit(
      selectedContent.filter(i => i.isSelected) as WordCloudContextItem[],
      selectedChars.filter(c => c.isSelected).map(c => ({ id: c.id, name: c.name }))
    )
  }

  const readyToSubmit =
    selectedContent.some(i => i.isSelected) || selectedChars.some(c => c.isSelected)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Select Characters (optional)</h3>
        <div className="flex flex-wrap gap-2">
          {selectedChars.map(c => (
            <label key={c.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={c.isSelected}
                onChange={() =>
                  setSelectedChars(prev =>
                    prev.map(x => (x.id === c.id ? { ...x, isSelected: !x.isSelected } : x))
                  )
                }
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
          {selectedContent.map(item => {
            const key = `${item.type}-${item.id}`
            return (
              <label
                key={key}
                className={`flex items-center gap-1.5 text-sm cursor-pointer px-2 py-1 rounded ${
                  unitBg[item.type] ?? ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.isSelected}
                  onChange={() =>
                    setSelectedContent(prev =>
                      prev.map(x =>
                        x.type === item.type && x.id === item.id
                          ? { ...x, isSelected: !x.isSelected }
                          : x
                      )
                    )
                  }
                  className="rounded"
                />
                {item.label}
              </label>
            )
          })}
        </div>
      </div>

      <button
        disabled={!readyToSubmit}
        onClick={submitSelection}
        className="px-4 py-2 bg-blue-600 text-white text-sm rounded disabled:opacity-50 hover:bg-blue-700"
      >
        {readyToSubmit
          ? 'Generate Word Clouds'
          : 'Please select at least one character or one piece of the play.'}
      </button>
    </div>
  )
}
