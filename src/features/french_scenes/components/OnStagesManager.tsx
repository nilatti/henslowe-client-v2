import { useState } from 'react'
import { useCreateOnStage } from '../api/frenchScenes'
import { OnStageItem } from './OnStageItem'
import type { FrenchSceneDetail } from '../types/frenchScene'
import type { PlaySkeleton } from '../../plays/types/play'
import { Button, Card } from '../../../components/ui'
import { useIsSuperAdmin } from '../../../hooks/useUserRole'

interface OnStagesManagerProps {
  frenchScene: FrenchSceneDetail
  playSkeleton: PlaySkeleton
}

export function OnStagesManager({
  frenchScene,
  playSkeleton,
}: OnStagesManagerProps) {
  const createOnStage = useCreateOnStage(frenchScene.id)
  const isSuperAdmin = useIsSuperAdmin()

  const [showForm, setShowForm] = useState(false)
  const [selectedType, setSelectedType] = useState<'character' | 'character_group'>('character')
  const [selectedId, setSelectedId] = useState<number | ''>('')
  const [nonspeaking, setNonspeaking] = useState(false)

  const onStageCharacterIds = new Set(
    frenchScene.on_stages.map(os => os.character_id).filter(Boolean)
  )
  const onStageGroupIds = new Set(
    frenchScene.on_stages.map(os => os.character_group_id).filter(Boolean)
  )

  const availableCharacters = playSkeleton.characters.filter(
    c => !onStageCharacterIds.has(c.id)
  )
  const availableGroups = (playSkeleton.character_groups ?? []).filter(
    cg => !onStageGroupIds.has(cg.id)
  )

  const availableOptions =
    selectedType === 'character' ? availableCharacters : availableGroups

  const handleSubmit = async () => {
    if (!selectedId) return
    await createOnStage.mutateAsync({
      french_scene_id: frenchScene.id,
      character_id: selectedType === 'character' ? Number(selectedId) : null,
      character_group_id:
        selectedType === 'character_group' ? Number(selectedId) : null,
      nonspeaking,
    })
    setSelectedId('')
    setNonspeaking(false)
    setShowForm(false)
  }

  const sortedOnStages = [...frenchScene.on_stages].sort((a, b) => {
    const nameA = a.character?.name ?? a.character_group?.name ?? ''
    const nameB = b.character?.name ?? b.character_group?.name ?? ''
    return nameA.localeCompare(nameB)
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          On Stage ({frenchScene.on_stages.length})
        </h3>
        {isSuperAdmin && !showForm && (
          <Button onClick={() => setShowForm(true)}>
            + Add
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="p-4 mb-3">
          <div className="space-y-3">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  checked={selectedType === 'character'}
                  onChange={() => {
                    setSelectedType('character')
                    setSelectedId('')
                  }}
                />
                Character
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  checked={selectedType === 'character_group'}
                  onChange={() => {
                    setSelectedType('character_group')
                    setSelectedId('')
                  }}
                />
                Character Group
              </label>
            </div>

            <select
              value={selectedId}
              onChange={e => setSelectedId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                Select {selectedType === 'character' ? 'character' : 'group'}
              </option>
              {availableOptions.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {availableOptions.length === 0 && (
              <p className="text-xs text-gray-400 italic">
                All {selectedType === 'character' ? 'characters' : 'groups'} are
                already on stage.
              </p>
            )}

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={nonspeaking}
                onChange={e => setNonspeaking(e.target.checked)}
                className="rounded border-gray-300"
              />
              Nonspeaking role
            </label>

            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowForm(false)
                  setSelectedId('')
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedId || createOnStage.isPending}
              >
                {createOnStage.isPending ? 'Adding...' : 'Add to scene'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {sortedOnStages.length === 0 ? (
          <p className="px-4 py-3 text-sm text-gray-500">
            No characters on stage yet.
          </p>
        ) : (
          <ul>
            {sortedOnStages.map(os => (
              <OnStageItem
                key={os.id}
                onStage={os}
                frenchSceneId={frenchScene.id}
                isAdmin={isSuperAdmin}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
