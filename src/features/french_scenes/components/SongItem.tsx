import { useState } from 'react'
import { useUpdateSong, useDeleteSong } from '../api/frenchScenes'
import type { Song } from '../types/frenchScene'
import type { PlaySkeleton } from '../../plays/types/play'
import { Button, ConfirmDialog } from '../../../components/ui'
import { CharacterCombobox } from './CharacterCombobox'

interface SongItemProps {
  song: Song
  frenchSceneId: number
  playSkeleton: PlaySkeleton
  isAdmin: boolean
}

export function SongItem({ song, frenchSceneId, playSkeleton, isAdmin }: SongItemProps) {
  const updateSong = useUpdateSong(frenchSceneId)
  const deleteSong = useDeleteSong(frenchSceneId)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(song.title)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showAddCharacter, setShowAddCharacter] = useState(false)

  const assignedCharacterIds = new Set(song.characters.map(c => c.id))

  const handleTitleSave = async () => {
    if (titleValue.trim() && titleValue.trim() !== song.title) {
      await updateSong.mutateAsync({ id: song.id, title: titleValue.trim() })
    }
    setEditingTitle(false)
  }

  const handleAddCharacter = async (_type: 'character' | 'character_group', id: number) => {
    await updateSong.mutateAsync({
      id: song.id,
      character_ids: [...Array.from(assignedCharacterIds), id],
    })
    setShowAddCharacter(false)
  }

  const handleRemoveCharacter = async (characterId: number) => {
    await updateSong.mutateAsync({
      id: song.id,
      character_ids: Array.from(assignedCharacterIds).filter(id => id !== characterId),
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

          {song.characters.length > 0 && (
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {song.characters.map(c => (
                <li key={c.id} className="flex items-center gap-1 text-xs bg-gray-100 rounded-full px-2 py-0.5 text-gray-700">
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
            </ul>
          )}

          {isAdmin && showAddCharacter && (
            <div className="mt-2">
              <CharacterCombobox
                characters={playSkeleton.characters}
                characterGroups={[]}
                excludeCharacterIds={assignedCharacterIds as Set<number>}
                excludeGroupIds={new Set()}
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

        {isAdmin && (
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
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
            setConfirmDelete(false)
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </li>
  )
}
