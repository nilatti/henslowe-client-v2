import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useCreateCharacter, useCreateCharacterGroup } from '../../../plays/api/characters'
import { Button, FormField, inputClass } from '../../../../components/ui'
import { CHARACTER_AGE_DESCRIPTORS, CHARACTER_GENDER_DESCRIPTORS } from '../../../../utils/constants'
import { firstLetterUpcase } from '../../../../utils/stringUtils'

interface Props {
  playId: number
  onCreated: (id: number, type: 'character' | 'character_group') => void
}

export default function NewCharacterForm({ playId, onCreated }: Props) {
  const createCharacter = useCreateCharacter(playId)
  const createGroup = useCreateCharacterGroup(playId)

  const [selectedType, setSelectedType] = useState<'character' | 'character_group'>('character')

  const form = useForm({
    defaultValues: {
      type: 'character' as 'character' | 'character_group',
      name: '',
      age: '',
      gender: '',
      description: '',
    },
    onSubmit: async ({ value }) => {
      if (value.type === 'character_group') {
        const created = await createGroup.mutateAsync({ name: value.name })
        onCreated(created.id, 'character_group')
      } else {
        const created = await createCharacter.mutateAsync({
          name: value.name,
          age: value.age || null,
          gender: value.gender || null,
          description: value.description || null,
          play_id: playId,
        })
        onCreated(created.id, 'character')
      }
      form.reset()
    },
  })

  return (
    <div className="p-4 max-w-md">
      <h3 className="text-lg font-semibold mb-4">Add New Character</h3>
      <form
        onSubmit={e => { e.preventDefault(); form.handleSubmit() }}
        className="space-y-3"
      >
        <form.Field name="type">
          {field => (
            <FormField label="Type" required>
              <select
                value={field.state.value}
                onChange={e => {
                  const t = e.target.value as 'character' | 'character_group'
                  field.handleChange(t)
                  setSelectedType(t)
                }}
                onBlur={field.handleBlur}
                className={inputClass}
              >
                <option value="character">Character</option>
                <option value="character_group">Character Group</option>
              </select>
            </FormField>
          )}
        </form.Field>

        <form.Field name="name">
          {field => (
            <FormField label="Name" required>
              <input
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                required
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>

        <form.Field name="description">
          {field => (
            <FormField label="Description">
              <textarea
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                rows={3}
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>

        {selectedType === 'character' && (
          <>
            <form.Field name="age">
              {field => (
                <FormField label="Age">
                  <select
                    value={field.state.value}
                    onChange={e => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className={inputClass}
                  >
                    <option value="">—</option>
                    {CHARACTER_AGE_DESCRIPTORS.map(a => (
                      <option key={a} value={a}>{firstLetterUpcase(a)}</option>
                    ))}
                  </select>
                </FormField>
              )}
            </form.Field>

            <form.Field name="gender">
              {field => (
                <FormField label="Gender">
                  <select
                    value={field.state.value}
                    onChange={e => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className={inputClass}
                  >
                    <option value="">—</option>
                    {CHARACTER_GENDER_DESCRIPTORS.map(g => (
                      <option key={g} value={g}>{firstLetterUpcase(g)}</option>
                    ))}
                  </select>
                </FormField>
              )}
            </form.Field>
          </>
        )}

        <div className="pt-1">
          <Button type="submit" disabled={form.state.isSubmitting}>
            {form.state.isSubmitting ? 'Adding...' : 'Add Character'}
          </Button>
        </div>
      </form>
    </div>
  )
}
