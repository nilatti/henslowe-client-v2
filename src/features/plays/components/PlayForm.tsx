import { useForm } from '@tanstack/react-form'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useCreatePlay, useUpdatePlay } from '../api/plays'
import { type PlaySkeleton } from '../types/play'
import { authorsQueryOptions } from '../../authors/api/authors'
import { FormField, FormActions, inputClass } from '../../../components/ui'

interface PlayFormProps {
  play?: PlaySkeleton
  authorId?: number
  onSuccess: (id?: number) => void
  onCancel: () => void
}

export function PlayForm({ play, authorId, onSuccess, onCancel }: PlayFormProps) {
  const create = useCreatePlay()
  const update = useUpdatePlay()
  const { data: authors } = useSuspenseQuery(authorsQueryOptions())
  const isEditing = !!play

  const form = useForm({
    defaultValues: {
      title: play?.title ?? '',
      author_id: play?.author?.id ?? authorId ?? 0,
      synopsis: play?.synopsis ?? '',
      text_notes: play?.text_notes ?? '',
      canonical: play?.canonical ?? true,
    },
    onSubmit: async ({ value }) => {
      if (isEditing) {
        await update.mutateAsync({ ...play, ...value })
        onSuccess()
      } else {
        const result = await create.mutateAsync(value)
        onSuccess(result?.id)
      }
    },
  })

  return (
    <form
      onSubmit={e => { e.preventDefault(); form.handleSubmit() }}
      className="space-y-4"
    >
      <form.Field name="title">
        {field => (
          <FormField label="Title" required>
            <input
              value={field.state.value}
              onChange={e => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              className={inputClass}
            />
          </FormField>
        )}
      </form.Field>

      {!authorId && (
        <form.Field name="author_id">
          {field => (
            <FormField label="Author" required>
              <select
                value={field.state.value}
                onChange={e => field.handleChange(Number(e.target.value))}
                onBlur={field.handleBlur}
                className={inputClass}
              >
                <option value={0}>Select an author</option>
                {authors
                  .sort((a, b) => a.last_name.localeCompare(b.last_name))
                  .map(author => (
                    <option key={author.id} value={author.id}>
                      {author.last_name}{author.first_name ? `, ${author.first_name}` : ''}
                    </option>
                  ))}
              </select>
            </FormField>
          )}
        </form.Field>
      )}

      {isEditing && (
        <>
          <form.Field name="synopsis">
            {field => (
              <FormField label="Synopsis">
                <textarea
                  value={field.state.value}
                  onChange={e => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  rows={4}
                  className={inputClass}
                />
              </FormField>
            )}
          </form.Field>

          <form.Field name="text_notes">
            {field => (
              <FormField label="Text notes">
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

          <form.Field name="canonical">
            {field => (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={field.state.value}
                  onChange={e => field.handleChange(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Canonical play (not a production copy)
              </label>
            )}
          </form.Field>
        </>
      )}

      <FormActions isSubmitting={form.state.isSubmitting} isEditing={isEditing} onCancel={onCancel} submitLabel="Create play" />
    </form>
  )
}
