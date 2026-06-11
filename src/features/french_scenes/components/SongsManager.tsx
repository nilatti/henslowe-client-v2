import { useState } from 'react'
import { useCreateSong } from '../api/frenchScenes'
import { SongItem } from './SongItem'
import type { FrenchSceneDetail } from '../types/frenchScene'
import type { PlaySkeleton } from '../../plays/types/play'
import { Button, Card } from '../../../components/ui'
import { useIsPlayAdmin } from '../../../hooks/useUserRole'

interface SongsManagerProps {
  frenchScene: FrenchSceneDetail
  playSkeleton: PlaySkeleton
}

export function SongsManager({ frenchScene, playSkeleton }: SongsManagerProps) {
  const createSong = useCreateSong(frenchScene.id)
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
            {frenchScene.songs.map(song => (
              <SongItem
                key={song.id}
                song={song}
                frenchSceneId={frenchScene.id}
                playSkeleton={playSkeleton}
                isAdmin={isAdmin}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
