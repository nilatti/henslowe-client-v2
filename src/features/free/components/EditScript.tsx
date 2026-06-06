import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useFreePlayStore } from '../store/freePlayStore'
import { TextEdit } from './TextEdit'
import {
  getFrenchScenesFromPlay,
  getFrenchScenesFromAct,
  mergeTextFromFrenchScenes,
} from '../../../utils/playScriptUtils'
import type { MergedText } from '../../script/types/script'

// Navigation key format used by the old getSelectedText:
// act: "actId"
// scene: "actId/sceneId"
// frenchScene: "actId/sceneId/frenchSceneId"
// play: "play"

interface EditScriptProps {
  linesPerMinute: string
}

export function EditScript({ linesPerMinute }: EditScriptProps) {
  const { play, getSelectedText, updateLine } = useFreePlayStore()
  const [selectedText, setSelectedText] = useState<object>({})
  const [text, setText] = useState<Partial<MergedText>>({})
  const [selectedNavKey, setSelectedNavKey] = useState<string | null>(null)

  function loadText(textMenuKey: string) {
    setSelectedNavKey(textMenuKey)
    const slashes = textMenuKey.match(/\//g)?.length ?? 0
    const isPlay = textMenuKey === 'play'
    let textUnit: string
    if (isPlay) {
      textUnit = 'play'
    } else if (!slashes) {
      textUnit = 'act'
    } else if (slashes === 1) {
      textUnit = 'scene'
    } else {
      textUnit = 'frenchScene'
    }

    const tempSelectedText = getSelectedText(textMenuKey, textUnit) as Record<string, unknown>
    setSelectedText(tempSelectedText)

    if (!play) return

    let frenchScenes: ReturnType<typeof getFrenchScenesFromPlay> = []
    if (textUnit === 'play') {
      frenchScenes = getFrenchScenesFromPlay(play as unknown as Parameters<typeof getFrenchScenesFromPlay>[0])
    } else if (textUnit === 'act') {
      const act = play.acts.find(a => String(a.id) === textMenuKey)
      if (act) frenchScenes = getFrenchScenesFromAct(act as unknown as Parameters<typeof getFrenchScenesFromAct>[0])
    } else if (textUnit === 'scene') {
      const fs = tempSelectedText.french_scenes as typeof frenchScenes | undefined
      frenchScenes = fs ?? []
    } else if (textUnit === 'frenchScene') {
      setText(tempSelectedText as Partial<MergedText>)
      return
    }
    setText(mergeTextFromFrenchScenes(frenchScenes) as Partial<MergedText>)
  }

  function handleLineSubmit(line: Parameters<typeof updateLine>[0]) {
    updateLine(line)
    const fieldKey: keyof MergedText = (text.stage_directions ?? []).some(l => l.id === line.id)
      ? 'stage_directions'
      : (text.sound_cues ?? []).some(l => l.id === line.id)
      ? 'sound_cues'
      : 'lines'
    const oldItems = (text[fieldKey] ?? []) as typeof line[]
    const newItems = oldItems.map(l => (l.id === line.id ? line : l))
    setText(prev => ({ ...prev, [fieldKey]: newItems }))
  }

  if (!play) return null

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">
        <Link
          to="/plays/$playId"
          params={{ playId: String(play.id) }}
          className="text-blue-600 hover:text-blue-800"
        >
          {play.title}
        </Link>
      </h2>

      <div className="flex gap-4">
        {/* Text selector nav */}
        <nav className="w-48 shrink-0 text-sm overflow-y-auto max-h-screen sticky top-4">
          <button
            onClick={() => loadText('play')}
            className={`w-full text-left px-3 py-1.5 rounded text-sm font-medium mb-1 ${
              selectedNavKey === 'play'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Full play
          </button>

          {play.acts.map(act => (
            <div key={act.id} className="mb-1">
              <button
                onClick={() => loadText(String(act.id))}
                className={`w-full text-left px-3 py-1.5 rounded text-sm font-medium ${
                  selectedNavKey === String(act.id)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Act {act.number}
              </button>

              {act.scenes.map(scene => (
                <div key={scene.id} className="ml-3">
                  <button
                    onClick={() => loadText(`${act.id}/${scene.id}`)}
                    className={`w-full text-left px-3 py-1 rounded text-xs ${
                      selectedNavKey === `${act.id}/${scene.id}`
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    Scene {scene.pretty_name}
                  </button>

                  {scene.french_scenes.map(fs => (
                    <button
                      key={fs.id}
                      onClick={() => loadText(`${act.id}/${scene.id}/${fs.id}`)}
                      className={`w-full text-left px-3 py-0.5 rounded text-xs ml-2 ${
                        selectedNavKey === `${act.id}/${scene.id}/${fs.id}`
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      {fs.pretty_name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </nav>

        <TextEdit
          handleLineSubmit={handleLineSubmit}
          linesPerMinute={linesPerMinute}
          selectedText={selectedText as { id?: number; heading?: string; pretty_name?: string }}
          text={text}
        />
      </div>
    </div>
  )
}
