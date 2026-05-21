import { useForm } from '@tanstack/react-form'
import { Button } from '../../../../components/ui'
import type { PlayCharacter } from '../../../plays/types/play'
import type { StageExit } from '../../types/stageExit'
import type { EntranceExit } from '../../types/entranceExit'

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
            <select
              multiple
              value={field.state.value.map(String)}
              onChange={e => {
                const selected = Array.from(e.target.selectedOptions).map(o =>
                  Number(o.value)
                )
                field.handleChange(selected)
              }}
              onBlur={field.handleBlur}
              required
              size={Math.min(characters.length, 6)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {characters.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Ctrl/Cmd+click to select multiple</p>
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
