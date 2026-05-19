import { useForm } from '@tanstack/react-form'
import { useCreateFrenchScene, useUpdateFrenchScene } from '../api/frenchScenes'
import type { FrenchScene } from '../types/frenchScene'
import { Button } from '../../../components/ui'

interface FrenchSceneFormProps {
  playId: number
  sceneId: number
  frenchScene?: FrenchScene
  nextNumber?: string
  onSuccess: () => void
  onCancel: () => void
}

export function FrenchSceneForm({
  playId,
  sceneId,
  frenchScene,
  nextNumber = 'a',
  onSuccess,
  onCancel,
}: FrenchSceneFormProps) {
  const create = useCreateFrenchScene(playId, sceneId)
  const update = useUpdateFrenchScene(playId, sceneId)
  const isEditing = !!frenchScene

  const form = useForm({
    defaultValues: {
      number: frenchScene?.number ?? nextNumber,
      summary: frenchScene?.summary ?? '',
      start_page: frenchScene?.start_page ?? '',
      end_page: frenchScene?.end_page ?? '',
    },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        scene_id: sceneId,
        start_page: value.start_page ? Number(value.start_page) : null,
        end_page: value.end_page ? Number(value.end_page) : null,
        summary: value.summary || null,
      }
      if (isEditing) {
        await update.mutateAsync({ ...frenchScene, ...payload })
      } else {
        await create.mutateAsync(payload)
      }
      onSuccess()
    },
  })

  return (
    <form
      onSubmit={e => { e.preventDefault(); form.handleSubmit() }}
      className="space-y-4"
    >
      <div className="grid grid-cols-3 gap-4">
        <form.Field name="number">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number *
                <span className="text-gray-400 font-normal ml-1">(a, b, c...)</span>
              </label>
              <input
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="a"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </form.Field>

        <form.Field name="start_page">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start page
              </label>
              <input
                type="number"
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </form.Field>

        <form.Field name="end_page">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End page
              </label>
              <input
                type="number"
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </form.Field>
      </div>

      <form.Field name="summary">
        {field => (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Summary
            </label>
            <textarea
              value={field.state.value}
              onChange={e => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </form.Field>

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.state.isSubmitting}>
          {form.state.isSubmitting
            ? 'Saving...'
            : isEditing ? 'Save changes' : 'Create french scene'}
        </Button>
      </div>
    </form>
  )
}
