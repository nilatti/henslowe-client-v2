import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { calculateLineCount } from '../../../../utils/playScriptUtils'
import { isLineCut } from '../../utils/scriptUtils'
import {
  useUpdateCharacter,
  useUpdateCharacterGroup,
  useDeleteCharacter,
  useDeleteCharacterGroup,
} from '../../../plays/api/characters'
import { playSkeletonQueryOptions } from '../../../plays/api/plays'
import { CharacterLine } from './CharacterLine'
import { Button, ConfirmDialog } from '../../../../components/ui'
import type { CharacterWithLines, CharacterGroupWithLines } from '../../../plays/types/play'
import { CHARACTER_AGE_DESCRIPTORS, CHARACTER_GENDER_DESCRIPTORS } from '../../../../utils/constants'
import { firstLetterUpcase } from '../../../../utils/stringUtils'

type CharacterEntry =
  | (CharacterWithLines & { type: 'character' })
  | (CharacterGroupWithLines & { type: 'character_group' })

interface Props {
  character: CharacterEntry
  playId: number
}

const inputClass =
  'px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const labelClass = 'text-xs font-medium text-gray-500 mb-0.5'

export default function CharacterInfoTab({ character, playId }: Props) {
  const charData = character.type === 'character' ? character : null
  const { data: skeleton } = useSuspenseQuery(playSkeletonQueryOptions(playId))

  const characterSongs = (() => {
    const fsLabelMap = new Map<number, string>()
    skeleton.acts.forEach(act => {
      act.scenes.forEach(scene => {
        scene.french_scenes.forEach(fs => {
          fsLabelMap.set(fs.id, `${act.number}.${scene.number}.${fs.number}`)
        })
      })
    })
    return skeleton.acts.flatMap(act =>
      act.scenes.flatMap(scene =>
        scene.french_scenes.flatMap(fs =>
          fs.songs
            .filter(song =>
              character.type === 'character'
                ? song.characters.some(c => c.id === character.id)
                : song.character_groups.some(g => g.id === character.id)
            )
            .map(song => ({ id: song.id, title: song.title, fsLabel: fsLabelMap.get(fs.id) ?? '' }))
        )
      )
    )
  })()

  const [editingField, setEditingField] = useState<string | null>(null)
  const [name, setName] = useState(character.name ?? '')
  const [gender, setGender] = useState(charData?.gender ?? '')
  const [age, setAge] = useState(charData?.age ?? '')
  const [description, setDescription] = useState(charData?.description ?? '')
  const [showCut, setShowCut] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const updateCharacter = useUpdateCharacter(playId)
  const updateCharacterGroup = useUpdateCharacterGroup(playId)
  const deleteCharacter = useDeleteCharacter(playId)
  const deleteCharacterGroup = useDeleteCharacterGroup(playId)

  const lines = character.lines.filter(line => {
    if (!/\S/.test(line.original_content)) return false
    if (!showCut && isLineCut(line)) return false
    return true
  })

  function save() {
    if (character.type === 'character') {
      updateCharacter.mutate({
        id: character.id,
        name,
        age: age || null,
        gender: gender || null,
        description: description || null,
        play_id: character.play_id,
      })
    } else {
      updateCharacterGroup.mutate({ id: character.id, name })
    }
    setEditingField(null)
  }

  function handleDelete() {
    if (character.type === 'character') {
      deleteCharacter.mutate(character.id)
    } else {
      deleteCharacterGroup.mutate(character.id)
    }
    setConfirmDelete(false)
  }

  return (
    <div className="p-4">
      {/* Name */}
      <div className="flex items-start gap-2 mb-4">
        {editingField === 'name' ? (
          <form
            onSubmit={e => { e.preventDefault(); save() }}
            className="flex gap-2 items-center"
          >
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              className={inputClass}
            />
            <button type="submit" className="text-xs text-blue-600 hover:text-blue-800">
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditingField(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </form>
        ) : (
          <h2
            className="text-2xl font-semibold cursor-pointer hover:bg-gray-100 rounded px-1 -ml-1"
            onDoubleClick={() => setEditingField('name')}
            title="Double-click to edit"
          >
            {name}
          </h2>
        )}
        <button
          onClick={() => setConfirmDelete(true)}
          className="ml-auto mt-1 text-red-400 hover:text-red-600 p-1 shrink-0"
          title="Delete character"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {character.type === 'character' && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Gender */}
            <div>
              <div className={labelClass}>Gender</div>
              {editingField === 'gender' ? (
                <form
                  onSubmit={e => { e.preventDefault(); save() }}
                  className="flex gap-2 items-center"
                >
                  <select
                    autoFocus
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">—</option>
                    {CHARACTER_GENDER_DESCRIPTORS.map(g => (
                      <option key={g} value={g}>{firstLetterUpcase(g)}</option>
                    ))}
                  </select>
                  <button type="submit" className="text-xs text-blue-600 hover:text-blue-800">
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingField(null)}
                    className="text-xs text-gray-500"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <p
                  className="text-sm text-gray-700 cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 min-h-[1.5rem]"
                  onDoubleClick={() => setEditingField('gender')}
                  title="Double-click to edit"
                >
                  {gender || (
                    <span className="text-gray-400 italic">Double-click to add gender</span>
                  )}
                </p>
              )}
            </div>

            {/* Age */}
            <div>
              <div className={labelClass}>Age</div>
              {editingField === 'age' ? (
                <form
                  onSubmit={e => { e.preventDefault(); save() }}
                  className="flex gap-2 items-center"
                >
                  <select
                    autoFocus
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">—</option>
                    {CHARACTER_AGE_DESCRIPTORS.map(a => (
                      <option key={a} value={a}>{firstLetterUpcase(a)}</option>
                    ))}
                  </select>
                  <button type="submit" className="text-xs text-blue-600 hover:text-blue-800">
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingField(null)}
                    className="text-xs text-gray-500"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <p
                  className="text-sm text-gray-700 cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 min-h-[1.5rem]"
                  onDoubleClick={() => setEditingField('age')}
                  title="Double-click to edit"
                >
                  {age || (
                    <span className="text-gray-400 italic">Double-click to add age</span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <div className={labelClass}>Description</div>
            {editingField === 'description' ? (
              <form onSubmit={e => { e.preventDefault(); save() }}>
                <textarea
                  autoFocus
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className={`${inputClass} w-full`}
                />
                <div className="flex gap-2 mt-1">
                  <button type="submit" className="text-xs text-blue-600 hover:text-blue-800">
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingField(null)}
                    className="text-xs text-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <p
                className="text-sm text-gray-700 cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 min-h-[1.5rem] whitespace-pre-wrap"
                onDoubleClick={() => setEditingField('description')}
                title="Double-click to edit"
              >
                {description || (
                  <span className="text-gray-400 italic">Double-click to add description</span>
                )}
              </p>
            )}
          </div>
        </>
      )}

      {characterSongs.length > 0 && (
        <div className="mb-4">
          <div className={labelClass}>Songs</div>
          <ul className="mt-1 space-y-0.5">
            {characterSongs.map(song => (
              <li key={song.id} className="text-sm text-gray-700">
                {song.title}
                <span className="text-gray-400 ml-1 text-xs">({song.fsLabel})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats and controls */}
      <div className="flex items-center gap-4 mb-4">
        <p className="text-sm text-gray-600">
          Lines:{' '}
          <span className="font-medium">
            {calculateLineCount(character.lines as Parameters<typeof calculateLineCount>[0])}
          </span>
        </p>
        <Button variant="secondary" onClick={() => setShowCut(v => !v)}>
          {showCut ? 'Hide' : 'Show'} Cut Text
        </Button>
      </div>

      {/* Lines */}
      <div>
        {lines.map(line => (
          <CharacterLine key={line.id} line={line} showCut={showCut} />
        ))}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete "${name}"? This cannot be undone.`}
          isDestructive
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
