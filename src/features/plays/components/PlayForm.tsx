import { useForm } from '@tanstack/react-form'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useCreatePlay, useUpdatePlay } from '../api/plays'
import { type PlaySkeleton } from '../types/play'
import { authorsQueryOptions } from '../../authors/api/authors'
import { Button } from '../../../components/ui'

interface PlayFormProps {
  play?: PlaySkeleton
  onSuccess: (id?: number) => void
  onCancel: () => void
}

export function PlayForm({ play, onSuccess, onCancel }: PlayFormProps) {
  const create = useCreatePlay()
  const update = useUpdatePlay()
  const { data: authors } = useSuspenseQuery(authorsQueryOptions())
  const isEditing = !!play

  const form = useForm({
    defaultValues: {
      title: play?.title ?? '',
      author_id: play?.author?.id ?? 0,
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
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

      <form.Field name="author_id">
        {field => (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Author *
            </label>
            <select
              value={field.state.value}
              onChange={e => field.handleChange(Number(e.target.value))}
              onBlur={field.handleBlur}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          </div>
        )}
      </form.Field>

      {isEditing && (
        <>
          <form.Field name="synopsis">
            {field => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Synopsis
                </label>
                <textarea
                  value={field.state.value}
                  onChange={e => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="text_notes">
            {field => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Text notes
                </label>
                <textarea
                  value={field.state.value}
                  onChange={e => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.state.isSubmitting}>
          {form.state.isSubmitting
            ? 'Saving...'
            : isEditing ? 'Save changes' : 'Create play'}
        </Button>
      </div>
    </form>
  )
}
