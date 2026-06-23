import { useForm } from '@tanstack/react-form'
import { useCreateScene, useUpdateScene } from '../api/scenes'
import type { Scene } from '../types/scene'
import { FormField, FormActions, inputClass } from '../../../components/ui'

interface SceneFormProps {
  playId: number
  actId: number
  scene?: Scene
  nextNumber?: number
  defaultSummary?: string
  onSuccess: () => void
  onCancel: () => void
}

export function SceneForm({
  playId,
  actId,
  scene,
  nextNumber = 1,
  defaultSummary,
  onSuccess,
  onCancel,
}: SceneFormProps) {
  const create = useCreateScene(playId, actId)
  const update = useUpdateScene(playId, actId)
  const isEditing = !!scene

  const form = useForm({
    defaultValues: {
      number: scene?.number ?? nextNumber,
      heading: scene?.heading ?? '',
      summary: scene?.summary ?? defaultSummary ?? '',
      start_page: scene?.start_page ?? '',
      end_page: scene?.end_page ?? '',
    },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        act_id: actId,
        number: Number(value.number),
        start_page: value.start_page ? Number(value.start_page) : null,
        end_page: value.end_page ? Number(value.end_page) : null,
        heading: value.heading || null,
        summary: value.summary || null,
      }
      if (isEditing) {
        await update.mutateAsync({ ...scene, ...payload })
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
      <div className="grid grid-cols-2 gap-4">
        <form.Field name="number">
          {field => (
            <FormField label="Scene number" required>
              <input
                type="number"
                value={field.state.value}
                onChange={e => field.handleChange(Number(e.target.value))}
                onBlur={field.handleBlur}
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>

        <form.Field name="heading">
          {field => (
            <FormField label="Heading">
              <input
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="e.g. A Room in the Castle"
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
              rows={3}
              className={inputClass}
            />
          </FormField>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
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

      <FormActions isSubmitting={form.state.isSubmitting} isEditing={isEditing} onCancel={onCancel} submitLabel="Create scene" />
    </form>
  )
}
