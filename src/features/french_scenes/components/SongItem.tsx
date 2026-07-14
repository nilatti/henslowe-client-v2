import { useState } from 'react'
import { useUpdateSong, useDeleteSong } from '../api/frenchScenes'
import { useConfirmDelete } from '../../../hooks/useConfirmDelete'
import type { Song } from '../types/frenchScene'
import type { PlaySkeleton } from '../../plays/types/play'
import { Button, ConfirmDialog } from '../../../components/ui'
import { CharacterCombobox } from './CharacterCombobox'

interface SongItemProps {
  song: Song
  frenchSceneId: number
  playId: number
  sceneId: number
  playSkeleton: PlaySkeleton
  isAdmin: boolean
  isFirst?: boolean
  isLast?: boolean
  onMove?: (direction: 'up' | 'down') => void
}

export function SongItem({ song, frenchSceneId, playId, sceneId, playSkeleton, isAdmin, isFirst, isLast, onMove }: SongItemProps) {
  const updateSong = useUpdateSong(frenchSceneId, playId, sceneId)
  const deleteSong = useDeleteSong(frenchSceneId, playId, sceneId)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(song.title)
  const { target: confirmDelete, open: requestDelete, close: clearDelete } = useConfirmDelete()
  const [showAddCharacter, setShowAddCharacter] = useState(false)

  const assignedCharacterIds = new Set(song.characters.map(c => c.id))
  const assignedGroupIds = new Set((song.character_groups ?? []).map(g => g.id))

  const handleTitleSave = async () => {
    if (titleValue.trim() && titleValue.trim() !== song.title) {
      await updateSong.mutateAsync({ id: song.id, title: titleValue.trim() })
    }
    setEditingTitle(false)
  }

  const handleAddCharacter = async (type: 'character' | 'character_group', id: number) => {
    if (type === 'character_group') {
      await updateSong.mutateAsync({
        id: song.id,
        character_group_ids: [...Array.from(assignedGroupIds), id],
      })
    } else {
      await updateSong.mutateAsync({
        id: song.id,
        character_ids: [...Array.from(assignedCharacterIds), id],
      })
    }
    setShowAddCharacter(false)
  }

  const handleRemoveCharacter = async (characterId: number) => {
    await updateSong.mutateAsync({
      id: song.id,
      character_ids: Array.from(assignedCharacterIds).filter(id => id !== characterId),
    })
  }

  const handleRemoveGroup = async (groupId: number) => {
    await updateSong.mutateAsync({
      id: song.id,
      character_group_ids: Array.from(assignedGroupIds).filter(id => id !== groupId),
    })
  }

  return (
    <li className="px-4 py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={titleValue}
                onChange={e => setTitleValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleTitleSave()
                  if (e.key === 'Escape') { setTitleValue(song.title); setEditingTitle(false) }
                }}
                className="text-sm font-medium border border-gray-300 rounded px-2 py-0.5 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <Button onClick={handleTitleSave} disabled={updateSong.isPending}>Save</Button>
              <Button variant="secondary" onClick={() => { setTitleValue(song.title); setEditingTitle(false) }}>Cancel</Button>
            </div>
          ) : (
            <span
              className={`text-sm font-medium text-gray-900 ${isAdmin ? 'cursor-pointer hover:text-blue-600' : ''}`}
              onClick={isAdmin ? () => setEditingTitle(true) : undefined}
            >
              {song.title}
            </span>
          )}

          {(song.characters.length > 0 || (song.character_groups?.length ?? 0) > 0) && (
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {[...song.characters].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                <li key={`c-${c.id}`} className="flex items-center gap-1 text-sm bg-gray-100 rounded-full px-2 py-0.5 text-gray-700">
                  {c.name}
                  {isAdmin && (
                    <button
                      onClick={() => handleRemoveCharacter(c.id)}
                      className="text-gray-400 hover:text-red-500 ml-0.5 leading-none"
                      title={`Remove ${c.name}`}
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
              {[...(song.character_groups ?? [])].sort((a, b) => a.name.localeCompare(b.name)).map(g => (
                <li key={`g-${g.id}`} className="flex items-center gap-1 text-sm bg-blue-50 rounded-full px-2 py-0.5 text-blue-700">
                  {g.name}
                  <span className="text-blue-400">(group)</span>
                  {isAdmin && (
                    <button
                      onClick={() => handleRemoveGroup(g.id)}
                      className="text-blue-400 hover:text-red-500 ml-0.5 leading-none"
                      title={`Remove ${g.name}`}
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {isAdmin && showAddCharacter && (
            <div className="mt-2">
              <CharacterCombobox
                characters={playSkeleton.characters}
                characterGroups={playSkeleton.character_groups ?? []}
                excludeCharacterIds={assignedCharacterIds as Set<number>}
                excludeGroupIds={assignedGroupIds as Set<number>}
                playId={playSkeleton.id}
                onSelect={handleAddCharacter}
                disabled={updateSong.isPending}
              />
            </div>
          )}

          {isAdmin && (
            <button
              className="mt-1.5 text-xs text-blue-600 hover:text-blue-800"
              onClick={() => setShowAddCharacter(v => !v)}
            >
              {showAddCharacter ? 'Cancel' : '+ Add character'}
            </button>
          )}
        </div>

        {isAdmin && onMove && (
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => onMove('up')}
              disabled={isFirst}
              className="text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed leading-none px-1"
              title="Move up"
            >
              ▲
            </button>
            <button
              onClick={() => onMove('down')}
              disabled={isLast}
              className="text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed leading-none px-1"
              title="Move down"
            >
              ▼
            </button>
          </div>
        )}

        {isAdmin && (
          <Button variant="danger" onClick={requestDelete}>
            Delete
          </Button>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete "${song.title}"?`}
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deleteSong.mutateAsync(song.id)
            clearDelete()
          }}
          onCancel={clearDelete}
        />
      )}
    </li>
  )
}
