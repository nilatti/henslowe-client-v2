import { useForm } from '@tanstack/react-form'
import { Button } from '../../../../components/ui'
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stage Exit <span className="text-red-500">*</span>
            </label>
            <select
              value={String(field.state.value)}
              onChange={e =>
                field.handleChange(e.target.value === '' ? '' : Number(e.target.value))
              }
              onBlur={field.handleBlur}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose the exit</option>
              {stageExits.map(se => (
                <option key={se.id} value={se.id}>
                  {se.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </form.Field>

      <form.Field name="character_ids">
        {field => (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Characters <span className="text-red-500">*</span>
            </label>
            {field.state.value.length > 0 && (
              <ul className="mb-2 flex flex-wrap gap-1.5">
                {field.state.value.map(id => {
                  const char = characters.find(c => c.id === id)
                  if (!char) return null
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
          </div>
        )}
      </form.Field>

      <form.Field name="category">
        {field => (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={field.state.value}
              onChange={e =>
                field.handleChange(e.target.value as 'Enter' | 'Exit' | '')
              }
              onBlur={field.handleBlur}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value=""></option>
              <option value="Enter">Enter</option>
              <option value="Exit">Exit</option>
            </select>
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="line">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Line Number
              </label>
              <input
                type="number"
                value={field.state.value ?? ''}
                onChange={e =>
                  field.handleChange(e.target.value === '' ? null : Number(e.target.value))
                }
                onBlur={field.handleBlur}
                placeholder="line number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </form.Field>

        <form.Field name="page">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Page Number
              </label>
              <input
                type="number"
                value={field.state.value ?? ''}
                onChange={e =>
                  field.handleChange(e.target.value === '' ? null : Number(e.target.value))
                }
                onBlur={field.handleBlur}
                placeholder="page number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="notes">
        {field => (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={field.state.value}
              onChange={e => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              rows={3}
              placeholder="Add notes, like whether they should bring a certain prop on."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
