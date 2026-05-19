import { useForm } from '@tanstack/react-form'
import { useCreateAuthor, useUpdateAuthor } from '../api/authors'
import type { Author } from '../types/author'
import { Button } from '../../../components/ui'

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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First name
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

        <form.Field name="middle_name">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Middle name
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

        <form.Field name="last_name">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last name <span className="text-red-500">*</span>
              </label>
              <input
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="birthdate">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Born
              </label>
              <input
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="e.g. 1564"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </form.Field>

        <form.Field name="deathdate">
          {field => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Died
              </label>
              <input
                value={field.state.value}
                onChange={e => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="e.g. 1616"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </form.Field>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.state.isSubmitting}>
          {form.state.isSubmitting
            ? 'Saving...'
            : isEditing ? 'Save changes' : 'Create author'}
        </Button>
      </div>
    </form>
  )
}
