import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import {
  useCreateCharacter,
  useCreateCharacterGroup,
  useUpdateCharacter,
  useUpdateCharacterGroup,
} from '../api/characters'
import { type PlayCharacter, type PlayCharacterGroup } from '../types/play'
import { Button } from '../../../components/ui'
import {
  CHARACTER_AGE_DESCRIPTORS,
  CHARACTER_GENDER_DESCRIPTORS,
} from '../../../utils/constants'

interface CharacterFormProps {
  playId: number
  character?: PlayCharacter
  characterGroup?: PlayCharacterGroup
  onSuccess: () => void
  onCancel: () => void
}

export function CharacterForm({
  playId,
  character,
  characterGroup,
  onSuccess,
  onCancel,
}: CharacterFormProps) {
  const createCharacter = useCreateCharacter(playId)
  const createGroup = useCreateCharacterGroup(playId)
  const updateCharacter = useUpdateCharacter(playId)
  const updateGroup = useUpdateCharacterGroup(playId)

  const isEditingCharacter = !!character
  const isEditingGroup = !!characterGroup
  const isCreating = !isEditingCharacter && !isEditingGroup

  // Tracked separately so the JSX can react to it without form.useStore
  const [selectedType, setSelectedType] = useState<'character' | 'character_group'>('character')
  const showCharacterFields = isEditingCharacter || (isCreating && selectedType === 'character')

  const form = useForm({
    defaultValues: {
      type: 'character' as 'character' | 'character_group',
      name: character?.name ?? characterGroup?.name ?? '',
      age: character?.age ?? '',
      gender: character?.gender ?? '',
      description: character?.description ?? '',
    },
    onSubmit: async ({ value }) => {
      if (isEditingCharacter) {
        await updateCharacter.mutateAsync({ ...character, ...value })
      } else if (isEditingGroup) {
        await updateGroup.mutateAsync({ ...characterGroup, name: value.name })
      } else if (value.type === 'character_group') {
        await createGroup.mutateAsync({ name: value.name })
      } else {
        await createCharacter.mutateAsync({
          name: value.name,
          age: value.age || null,
          gender: value.gender || null,
          description: value.description || null,
          play_id: playId,
        })
      }
      onSuccess()
    },
  })

  return (
    <form
      onSubmit={e => { e.preventDefault(); form.handleSubmit() }}
      className="space-y-3 p-4"
    >
      {isCreating && (
        <form.Field name="type">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                value={field.state.value}
                onChange={e => {
                  const t = e.target.value as 'character' | 'character_group'
                  field.handleChange(t)
                  setSelectedType(t)
                }}
                onBlur={field.handleBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="character">Character</option>
                <option value="character_group">Character Group</option>
              </select>
            </div>
          )}
        </form.Field>
      )}

      <form.Field name="name">
        {field => (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              value={field.state.value}
              onChange={e => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </form.Field>

      {showCharacterFields && (
        <>
          <form.Field name="age">
            {field => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <select
                  value={field.state.value ?? ''}
                  onChange={e => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">—</option>
                  {CHARACTER_AGE_DESCRIPTORS.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            )}
          </form.Field>

          <form.Field name="gender">
            {field => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  value={field.state.value ?? ''}
                  onChange={e => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">—</option>
                  {CHARACTER_GENDER_DESCRIPTORS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            )}
          </form.Field>

          <form.Field name="description">
            {field => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={field.state.value ?? ''}
                  onChange={e => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </form.Field>
        </>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.state.isSubmitting}>
          {form.state.isSubmitting ? 'Saving...' : isCreating ? 'Add' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
