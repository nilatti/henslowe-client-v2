import { useForm } from '@tanstack/react-form'
import { useCreateFrenchScene, useUpdateFrenchScene } from '../api/frenchScenes'
import type { FrenchScene } from '../types/frenchScene'
import { FormField, FormActions, inputClass } from '../../../components/ui'

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
            <FormField label={<>Number <span className="text-gray-400 font-normal ml-1">(a, b, c...)</span></>} required>
              <input
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="a"
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>

        <form.Field name="start_page">
          {field => (
            <FormField label="Start page">
              <input
                type="number"
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>

        <form.Field name="end_page">
          {field => (
            <FormField label="End page">
              <input
                type="number"
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>
      </div>

      <form.Field name="summary">
        {field => (
          <FormField label="Summary">
            <textarea
              value={field.state.value}
              onChange={e => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              rows={2}
              className={inputClass}
            />
          </FormField>
        )}
      </form.Field>

      <FormActions isSubmitting={form.state.isSubmitting} isEditing={isEditing} onCancel={onCancel} submitLabel="Create french scene" />
    </form>
  )
}
