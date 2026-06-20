import { useState } from 'react'
import { useCreateSong, useMoveSong } from '../api/frenchScenes'
import { SongItem } from './SongItem'
import type { FrenchSceneDetail } from '../types/frenchScene'
import type { PlaySkeleton } from '../../plays/types/play'
import { Button, Card } from '../../../components/ui'
import { useIsPlayAdmin } from '../../../hooks/useUserRole'

interface SongsManagerProps {
  frenchScene: FrenchSceneDetail
  playSkeleton: PlaySkeleton
  sceneId: number
}

export function SongsManager({ frenchScene, playSkeleton, sceneId }: SongsManagerProps) {
  const playId = playSkeleton.id
  const createSong = useCreateSong(frenchScene.id, playId, sceneId)
  const moveSong = useMoveSong(frenchScene.id)
  const isAdmin = useIsPlayAdmin(playSkeleton.id)
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    await createSong.mutateAsync({ title: newTitle.trim() })
    setNewTitle('')
    setShowForm(false)
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Songs ({frenchScene.songs.length})
      </h3>

      {isAdmin && !showForm && (
        <Button className="mb-3" onClick={() => setShowForm(true)}>
          Add Song
        </Button>
      )}

      {showForm && (
        <Card className="p-4 mb-3">
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Song title"
              className="w-full text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => { setShowForm(false); setNewTitle('') }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!newTitle.trim() || createSong.isPending}>
                Add
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {frenchScene.songs.length === 0 ? (
          <p className="px-4 py-3 text-sm text-gray-500">No songs yet.</p>
        ) : (
          <ul>
            {[...frenchScene.songs].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((song, i, arr) => (
              <SongItem
                key={song.id}
                song={song}
                frenchSceneId={frenchScene.id}
                playId={playId}
                sceneId={sceneId}
                playSkeleton={playSkeleton}
                isAdmin={isAdmin}
                isFirst={i === 0}
                isLast={i === arr.length - 1}
                onMove={dir => moveSong.mutate({ id: song.id, direction: dir })}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
