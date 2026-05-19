import { useState } from 'react'
import { type PlaySkeleton, getAllCharacters } from '../types/play'
import { useDeleteCharacter, useDeleteCharacterGroup } from '../api/characters'
import { CharacterForm } from './CharacterForm'
import { Button, Card, ConfirmDialog } from '../../../components/ui'

interface CharactersTabProps {
  play: PlaySkeleton
  playId: number
  isSuperAdmin: boolean
}

export function CharactersTab({ play, playId, isSuperAdmin }: CharactersTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCharacterId, setEditingCharacterId] = useState<number | null>(null)
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
  const [confirmDeleteChar, setConfirmDeleteChar] = useState<number | null>(null)
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<number | null>(null)

  const deleteCharacter = useDeleteCharacter(playId)
  const deleteGroup = useDeleteCharacterGroup(playId)

  const editingCharacter =
    editingCharacterId !== null
      ? play.characters.find(c => c.id === editingCharacterId)
      : undefined

  const editingGroup =
    editingGroupId !== null
      ? play.character_groups.find(g => g.id === editingGroupId)
      : undefined

  const allCharacters = getAllCharacters(play)

  function rowKey(type: string, id: number) {
    return `${type}-${id}`
  }

  function toggleExpand(key: string) {
    setExpandedId(prev => (prev === key ? null : key))
  }

  return (
    <Card>
      {allCharacters.length === 0 && !showCreateForm && (
        <p className="px-4 py-3 text-sm text-gray-500">No characters yet.</p>
      )}

      {allCharacters.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {allCharacters.map(c => {
            const key = rowKey(c.type, c.id)
            const isExpanded = expandedId === key
            const isEditingThis =
              (c.type === 'character' && editingCharacterId === c.id) ||
              (c.type === 'character_group' && editingGroupId === c.id)

            if (isEditingThis) {
              return (
                <li key={key}>
                  {c.type === 'character' && editingCharacter ? (
                    <CharacterForm
                      playId={playId}
                      character={editingCharacter}
                      onSuccess={() => setEditingCharacterId(null)}
                      onCancel={() => setEditingCharacterId(null)}
                    />
                  ) : c.type === 'character_group' && editingGroup ? (
                    <CharacterForm
                      playId={playId}
                      characterGroup={editingGroup}
                      onSuccess={() => setEditingGroupId(null)}
                      onCancel={() => setEditingGroupId(null)}
                    />
                  ) : null}
                </li>
              )
            }

            return (
              <li key={key}>
                {/* Row header — clickable to expand */}
                <div
                  className="flex items-center justify-between px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => toggleExpand(key)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-medium">{c.name}</span>
                    {c.type === 'character_group' && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                        Group
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {isSuperAdmin && (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() =>
                            c.type === 'character'
                              ? setEditingCharacterId(c.id)
                              : setEditingGroupId(c.id)
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() =>
                            c.type === 'character'
                              ? setConfirmDeleteChar(c.id)
                              : setConfirmDeleteGroup(c.id)
                          }
                        >
                          Delete
                        </Button>
                      </>
                    )}
                    <span className="text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded detail — characters only */}
                {isExpanded && c.type === 'character' && (
                  <div className="px-4 pb-3 text-sm bg-gray-50 border-t border-gray-100">
                    {!c.age && !c.gender && !c.description ? (
                      <p className="text-gray-400 italic py-2">No additional info</p>
                    ) : (
                      <dl className="space-y-1 pt-2">
                        {c.age && (
                          <div className="flex gap-2">
                            <dt className="text-gray-500 w-20 shrink-0">Age</dt>
                            <dd className="text-gray-700">{c.age}</dd>
                          </div>
                        )}
                        {c.gender && (
                          <div className="flex gap-2">
                            <dt className="text-gray-500 w-20 shrink-0">Gender</dt>
                            <dd className="text-gray-700">{c.gender}</dd>
                          </div>
                        )}
                        {c.description && (
                          <div className="flex gap-2">
                            <dt className="text-gray-500 w-20 shrink-0">Description</dt>
                            <dd className="text-gray-700 leading-relaxed">{c.description}</dd>
                          </div>
                        )}
                      </dl>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {isSuperAdmin && (
        showCreateForm ? (
          <div className="border-t border-gray-100">
            <CharacterForm
              playId={playId}
              onSuccess={() => setShowCreateForm(false)}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        ) : (
          <div className="px-4 py-3 border-t border-gray-100">
            <Button onClick={() => setShowCreateForm(true)}>Add character</Button>
          </div>
        )
      )}

      {confirmDeleteChar !== null && (
        <ConfirmDialog
          message="Delete this character? They will be removed from all scenes."
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deleteCharacter.mutateAsync(confirmDeleteChar)
            setConfirmDeleteChar(null)
          }}
          onCancel={() => setConfirmDeleteChar(null)}
        />
      )}

      {confirmDeleteGroup !== null && (
        <ConfirmDialog
          message="Delete this character group? It will be removed from all scenes."
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deleteGroup.mutateAsync(confirmDeleteGroup)
            setConfirmDeleteGroup(null)
          }}
          onCancel={() => setConfirmDeleteGroup(null)}
        />
      )}
    </Card>
  )
}
