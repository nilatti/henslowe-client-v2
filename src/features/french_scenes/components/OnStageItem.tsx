import { useState } from 'react'
import { useUpdateOnStage, useDeleteOnStage } from '../api/frenchScenes'
import type { OnStage } from '../types/frenchScene'
import { Button, ConfirmDialog } from '../../../components/ui'

interface OnStageItemProps {
  onStage: OnStage
  frenchSceneId: number
  isAdmin: boolean
}

export function OnStageItem({
  onStage,
  frenchSceneId,
  isAdmin,
}: OnStageItemProps) {
  const updateOnStage = useUpdateOnStage(frenchSceneId)
  const deleteOnStage = useDeleteOnStage(frenchSceneId)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const name =
    onStage.character?.name ??
    onStage.character_group?.name ??
    'Unknown'

  const handleToggleNonspeaking = async () => {
    await updateOnStage.mutateAsync({
      id: onStage.id,
      nonspeaking: !onStage.nonspeaking,
    })
  }

  const handleToggleOffstage = async () => {
    await updateOnStage.mutateAsync({
      id: onStage.id,
      offstage: !onStage.offstage,
    })
  }

  return (
    <li className="flex items-center justify-between px-4 py-2 text-sm border-b border-gray-100 last:border-0 hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <span className="text-gray-900 font-medium">{name}</span>
        {onStage.character_group && (
          <span className="text-xs text-gray-400">Group</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isAdmin && (
          <button
            onClick={handleToggleNonspeaking}
            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
              onStage.nonspeaking
                ? 'border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600'
                : 'border-blue-400 text-blue-600 hover:border-gray-300 hover:text-gray-500'
            }`}
            title="Toggle speaking/nonspeaking"
          >
            {onStage.nonspeaking ? 'Nonspeaking' : 'Speaking'}
          </button>
        )}
        {!isAdmin && (
          <span className="text-xs text-gray-400">
            {onStage.nonspeaking ? 'Nonspeaking' : 'Speaking'}
          </span>
        )}
        {isAdmin && (
          <button
            onClick={handleToggleOffstage}
            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
              onStage.offstage
                ? 'border-gray-300 text-gray-500 hover:border-amber-400 hover:text-amber-600'
                : 'border-amber-400 text-amber-600 hover:border-gray-300 hover:text-gray-500'
            }`}
            title="Toggle onstage/offstage"
          >
            {onStage.offstage ? 'Offstage' : 'Onstage'}
          </button>
        )}
        {!isAdmin && onStage.offstage && (
          <span className="text-xs text-gray-400">Offstage</span>
        )}
        {isAdmin && (
          <Button
            variant="danger"
            onClick={() => setConfirmDelete(true)}
          >
            Remove
          </Button>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          message={`Remove ${name} from this french scene?`}
          isDestructive
          confirmLabel="Remove"
          onConfirm={async () => {
            await deleteOnStage.mutateAsync(onStage.id)
            setConfirmDelete(false)
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </li>
  )
}
