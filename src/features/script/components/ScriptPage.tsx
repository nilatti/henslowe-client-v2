import { useState, useMemo } from 'react'
import { useSuspenseQuery, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { playScriptQueryOptions, useBulkUpdateLines } from '../api/script'
import { productionSkeletonQueryOptions } from '../../productions/api/productions'
import { TextSelector, type SelectionKey } from './TextSelector'
import { ScriptViewer } from './ScriptViewer'
import { ExportButtons } from './ExportButtons'
import { Button } from '../../../components/ui'
import {
  useUserRoleForProduction,
  useIsSuperAdmin,
} from '../../../hooks/useUserRole'
import {
  mergeTextFromFrenchScenes,
  getFrenchScenesFromAct,
  getFrenchScenesFromPlay,
} from '../utils/scriptUtils'
import type { MergedText, ScriptAct, ScriptFrenchScene } from '../types/script'

interface ScriptPageProps {
  playId: number
}

export function ScriptPage({ playId }: ScriptPageProps) {
  const { data: script } = useSuspenseQuery(playScriptQueryOptions(playId))

  const [selectedKey, setSelectedKey] = useState<SelectionKey | null>(null)
  const [showCut, setShowCut] = useState(true)

  const linesPerMinute = script.production?.lines_per_minute ?? null

  const isProductionCopy = !script.canonical && !!script.production_id
  const { data: productionSkeleton } = useQuery({
    ...productionSkeletonQueryOptions(script.production_id ?? 0),
    enabled: isProductionCopy,
  })
  const role = useUserRoleForProduction(script.production_id ?? 0, productionSkeleton?.theater.id)
  const isSuperAdmin = useIsSuperAdmin()
  const isEditable = isProductionCopy && (role === 'admin' || isSuperAdmin)

  const bulkUpdate = useBulkUpdateLines(playId)

  // The French scenes in the selected section, in play order.
  const selectedFrenchScenes = useMemo((): ScriptFrenchScene[] | null => {
    if (!selectedKey) return null

    if (selectedKey === 'play') return getFrenchScenesFromPlay(script)

    if (selectedKey.startsWith('act-')) {
      const actId = Number(selectedKey.split('-')[1])
      const act = script.acts.find(a => a.id === actId)
      return act ? getFrenchScenesFromAct(act) : null
    }

    if (selectedKey.startsWith('scene-')) {
      const [, , sceneId] = selectedKey.split('-').map(Number)
      const scene = script.acts.flatMap(a => a.scenes).find(s => s.id === sceneId)
      return scene ? scene.french_scenes : null
    }

    if (selectedKey.startsWith('fs-')) {
      const [, , , fsId] = selectedKey.split('-').map(Number)
      const fs = script.acts
        .flatMap(a => a.scenes.flatMap(s => s.french_scenes))
        .find(f => f.id === fsId)
      return fs ? [fs] : null
    }

    return null
  }, [selectedKey, script])

  const allFrenchScenes = useMemo(() => getFrenchScenesFromPlay(script), [script])
  // Dragging across the whole play is too slow; "Move…" covers it instead.
  const canDrag = selectedKey !== 'play'

  const selectedText = useMemo(
    (): MergedText | null =>
      selectedFrenchScenes ? mergeTextFromFrenchScenes(selectedFrenchScenes) : null,
    [selectedFrenchScenes]
  )

  const selectedAct = useMemo((): ScriptAct | null => {
    if (!selectedKey?.startsWith('act-')) return null
    const actId = Number(selectedKey.split('-')[1])
    return script.acts.find(a => a.id === actId) ?? null
  }, [selectedKey, script])

  const selectedLabel = useMemo(() => {
    if (!selectedKey) return null
    if (selectedKey === 'play') return script.title
    if (selectedKey.startsWith('act-')) {
      const actId = Number(selectedKey.split('-')[1])
      const act = script.acts.find(a => a.id === actId)
      return act ? `Act ${act.number}` : null
    }
    if (selectedKey.startsWith('scene-')) {
      const [, , sceneId] = selectedKey.split('-').map(Number)
      const scene = script.acts.flatMap(a => a.scenes).find(s => s.id === sceneId)
      return scene ? `Scene ${scene.pretty_name}` : null
    }
    if (selectedKey.startsWith('fs-')) {
      const [, , , fsId] = selectedKey.split('-').map(Number)
      const fs = script.acts
        .flatMap(a => a.scenes.flatMap(s => s.french_scenes))
        .find(f => f.id === fsId)
      return fs ? `French Scene ${fs.pretty_name}` : null
    }
    return null
  }, [selectedKey, script])

  const getBulkIds = () => {
    if (!selectedText) return null
    return {
      lineIds: selectedText.lines
        .filter(l => l.original_content?.trim())
        .map(l => l.id),
      sdIds: selectedText.stage_directions
        .filter(sd => sd.original_content?.trim())
        .map(sd => sd.id),
      scIds: selectedText.sound_cues
        .filter(sc => sc.original_content?.trim())
        .map(sc => sc.id),
    }
  }

  const handleCutAll = () => {
    const ids = getBulkIds()
    if (!ids) return
    bulkUpdate.mutate({ ...ids, newContent: '' })
  }

  const handleUncutAll = () => {
    const ids = getBulkIds()
    if (!ids) return
    bulkUpdate.mutate({ ...ids, newContent: null })
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link
            to="/plays/$playId"
            params={{ playId: String(playId) }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← {script.title}
          </Link>
          {!script.canonical && (
            <span className="ml-3 text-xs text-amber-600 italic">
              Production copy
              {isProductionCopy && script.production_id && (
                <>
                  {' · '}
                  <Link
                    to="/productions/$productionId"
                    params={{ productionId: String(script.production_id) }}
                    className="text-blue-600 hover:text-blue-800 not-italic"
                  >
                    {productionSkeleton?.theater.name ?? 'View production'}
                  </Link>
                </>
              )}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowCut(c => !c)}>
            {showCut ? 'Hide' : 'Show'} cut text
          </Button>
          {isEditable && selectedKey && (
            <>
              <Button
                variant="danger"
                onClick={handleCutAll}
                disabled={bulkUpdate.isPending}
              >
                Cut all
              </Button>
              <Button
                variant="secondary"
                onClick={handleUncutAll}
                disabled={bulkUpdate.isPending}
              >
                Restore all
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        <TextSelector
          play={script}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
        />

        <div className="flex-1 min-w-0 border-l border-gray-200 pl-8">
          {isEditable && (
            <div className="text-xs text-blue-600 mb-2 italic">
              Edit mode: double-click any line to edit, use Cut / Restore, or reorder with{' '}
              {canDrag ? 'drag ⋮⋮ or Move…' : 'Move… (load an act or smaller to drag)'}
              {canDrag && !showCut && ' (show cut text to drag)'}
            </div>
          )}
          {isProductionCopy && !isEditable && (
            <div className="text-xs text-gray-400 mb-2 italic">Read-only</div>
          )}
          {!selectedKey ? (
            <div className="text-sm text-gray-400 italic p-8 text-center">
              Select a section from the menu to view the script.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedLabel}
                </h2>
                {selectedAct && (
                  <ExportButtons act={selectedAct} playTitle={script.title} />
                )}
              </div>
              {selectedText && (
                <ScriptViewer
                  text={selectedText}
                  frenchScenes={selectedFrenchScenes ?? []}
                  allFrenchScenes={allFrenchScenes}
                  canDrag={canDrag}
                  showCut={showCut}
                  linesPerMinute={linesPerMinute}
                  isEditable={isEditable}
                  playId={playId}
                  characters={script.characters}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
