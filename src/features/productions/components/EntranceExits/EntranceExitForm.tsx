import { useForm } from '@tanstack/react-form'
import { Button, FormField, inputClass } from '../../../../components/ui'
import type { PlayCharacter } from '../../../plays/types/play'
import type { StageExit } from '../../types/stageExit'
import type { EntranceExit } from '../../types/entranceExit'
import { CharacterCombobox } from '../../../french_scenes/components/CharacterCombobox'

export interface EntranceExitFormData {
  category: 'Enter' | 'Exit' | ''
  line: number | null
  page: number | null
  notes: string
  stage_exit_id: number | ''
  character_ids: number[]
}

interface EntranceExitFormProps {
  frenchSceneId: number
  characters: PlayCharacter[]
  stageExits: StageExit[]
  entranceExit?: EntranceExit
  onSubmit: (data: EntranceExitFormData) => void
  onCancel: () => void
  isPending?: boolean
}

export function EntranceExitForm({
  characters,
  stageExits,
  entranceExit,
  onSubmit,
  onCancel,
  isPending,
}: EntranceExitFormProps) {
  const form = useForm({
    defaultValues: {
      category: (entranceExit?.category ?? '') as 'Enter' | 'Exit' | '',
      line: entranceExit?.line ?? null,
      page: entranceExit?.page ?? null,
      notes: entranceExit?.notes ?? '',
      stage_exit_id: (entranceExit?.stage_exit_id ?? '') as number | '',
      character_ids: entranceExit?.characters.map(c => c.id) ?? [],
    } satisfies EntranceExitFormData,
    onSubmit: async ({ value }) => {
      onSubmit(value)
    },
  })

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      <form.Field name="stage_exit_id">
        {field => (
          <FormField label="Stage Exit" required>
            <select
              value={String(field.state.value)}
              onChange={e =>
                field.handleChange(e.target.value === '' ? '' : Number(e.target.value))
              }
              onBlur={field.handleBlur}
              required
              className={inputClass}
            >
              <option value="">Choose the exit</option>
              {stageExits.map(se => (
                <option key={se.id} value={se.id}>
                  {se.name}
                </option>
              ))}
            </select>
          </FormField>
        )}
      </form.Field>

      <form.Field name="character_ids">
        {field => (
          <FormField label="Characters" required>
            {field.state.value.length > 0 && (
              <ul className="mb-2 flex flex-wrap gap-1.5">
                {[...field.state.value]
                  .map(id => characters.find(c => c.id === id))
                  .filter((c): c is PlayCharacter => !!c)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(char => {
                  const id = char.id
                  return (
                    <li key={id} className="flex items-center gap-1 text-sm bg-gray-100 rounded-full px-2 py-0.5 text-gray-700">
                      {char.name}
                      <button
                        type="button"
                        onClick={() => field.handleChange(field.state.value.filter(cid => cid !== id))}
                        className="text-gray-400 hover:text-red-500 ml-0.5 leading-none"
                      >
                        ×
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <CharacterCombobox
              characters={characters}
              characterGroups={[]}
              excludeCharacterIds={new Set(field.state.value)}
              excludeGroupIds={new Set()}
              playId={characters[0]?.play_id ?? 0}
              onSelect={(type, id) => {
                if (type === 'character') {
                  field.handleChange([...field.state.value, id])
                }
              }}
              disabled={isPending}
            />
          </FormField>
        )}
      </form.Field>

      <form.Field name="category">
        {field => (
          <FormField label="Category" required>
            <select
              value={field.state.value}
              onChange={e =>
                field.handleChange(e.target.value as 'Enter' | 'Exit' | '')
              }
              onBlur={field.handleBlur}
              required
              className={inputClass}
            >
              <option value=""></option>
              <option value="Enter">Enter</option>
              <option value="Exit">Exit</option>
            </select>
          </FormField>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="line">
          {field => (
            <FormField label="Line Number">
              <input
                type="number"
                value={field.state.value ?? ''}
                onChange={e =>
                  field.handleChange(e.target.value === '' ? null : Number(e.target.value))
                }
                onBlur={field.handleBlur}
                placeholder="line number"
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>

        <form.Field name="page">
          {field => (
            <FormField label="Page Number">
              <input
                type="number"
                value={field.state.value ?? ''}
                onChange={e =>
                  field.handleChange(e.target.value === '' ? null : Number(e.target.value))
                }
                onBlur={field.handleBlur}
                placeholder="page number"
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>
      </div>

      <form.Field name="notes">
        {field => (
          <FormField label="Notes">
            <textarea
              value={field.state.value}
              onChange={e => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              rows={3}
              placeholder="Add notes, like whether they should bring a certain prop on."
              className={inputClass}
            />
          </FormField>
        )}
      </form.Field>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
