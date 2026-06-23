import { useForm } from '@tanstack/react-form'
import { useCreateAuthor, useUpdateAuthor } from '../api/authors'
import type { Author } from '../types/author'
import { FormField, FormActions, inputClass } from '../../../components/ui'

interface AuthorFormProps {
  author?: Author
  onSuccess: () => void
  onCancel: () => void
}

export function AuthorForm({ author, onSuccess, onCancel }: AuthorFormProps) {
  const create = useCreateAuthor()
  const update = useUpdateAuthor()
  const isEditing = !!author

  const form = useForm({
    defaultValues: {
      first_name: author?.first_name ?? '',
      middle_name: author?.middle_name ?? '',
      last_name: author?.last_name ?? '',
      birthdate: author?.birthdate ?? '',
      deathdate: author?.deathdate ?? '',
    },
    onSubmit: async ({ value }) => {
      if (isEditing) {
        await update.mutateAsync({ ...author, ...value })
      } else {
        await create.mutateAsync(value)
      }
      onSuccess()
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
      <div className="grid grid-cols-3 gap-4">
        <form.Field name="first_name">
          {field => (
            <FormField label="First name">
              <input
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>

        <form.Field name="middle_name">
          {field => (
            <FormField label="Middle name">
              <input
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>

        <form.Field name="last_name">
          {field => (
            <FormField label="Last name" required>
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="birthdate">
          {field => (
            <FormField label="Born">
              <input
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="e.g. 1564"
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>

        <form.Field name="deathdate">
          {field => (
            <FormField label="Died">
              <input
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="e.g. 1616"
                className={inputClass}
              />
            </FormField>
          )}
        </form.Field>
      </div>

      <FormActions isSubmitting={form.state.isSubmitting} isEditing={isEditing} onCancel={onCancel} submitLabel="Create author" />
    </form>
  )
}
