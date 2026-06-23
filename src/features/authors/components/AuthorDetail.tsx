import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { authorQueryOptions, useDeleteAuthor } from '../api/authors'
import { AuthorForm } from './AuthorForm'
import { PlayForm } from '../../plays/components/PlayForm'
import { useIsSuperAdmin } from '../../../hooks/useUserRole'
import { useConfirmDelete } from '../../../hooks/useConfirmDelete'
import { Button, Card, ConfirmDialog, LinkedItemList, PageHeader } from '../../../components/ui'

interface AuthorDetailProps {
  authorId: number
}

export function AuthorDetail({ authorId }: AuthorDetailProps) {
  const navigate = useNavigate()
  const { data: author } = useSuspenseQuery(authorQueryOptions(authorId))
  const deleteAuthor = useDeleteAuthor()
  const isSuperAdmin = useIsSuperAdmin()

  const [isEditing, setIsEditing] = useState(false)
  const [showPlayForm, setShowPlayForm] = useState(false)
  const { target: confirmDelete, open: requestDelete, close: clearDelete } = useConfirmDelete()

  const nameParts = [author.first_name, author.middle_name, author.last_name].filter(Boolean)
  const fullName = nameParts.join(' ')

  const lifespan = author.birthdate || author.deathdate
    ? `${author.birthdate ?? '?'} – ${author.deathdate ?? 'present'}`
    : null

  const canonicalPlays = author.plays.filter(p => p.canonical)

  return (
    <div>
      <PageHeader
        title={fullName}
        action={
          isSuperAdmin ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              <Button variant="danger" onClick={requestDelete}>
                Delete
              </Button>
            </div>
          ) : undefined
        }
      />

      {isEditing ? (
        <Card className="p-6 mb-6">
          <AuthorForm
            author={author}
            onSuccess={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            {lifespan && (
              <p className="text-sm text-gray-500 mb-3">{lifespan}</p>
            )}
            {author.nationality && (
              <p className="text-sm text-gray-600 mb-2">{author.nationality}</p>
            )}
            {!lifespan && !author.nationality && (
              <p className="text-sm text-gray-400 italic">
                No additional information.
              </p>
            )}
          </Card>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-gray-900">
                Plays by {author.last_name || fullName}
              </h2>
              {isSuperAdmin && !showPlayForm && (
                <Button onClick={() => setShowPlayForm(true)}>
                  Add Play
                </Button>
              )}
            </div>

            {showPlayForm && (
              <Card className="p-6 mb-4">
                <PlayForm
                  authorId={author.id}
                  onSuccess={id => {
                    setShowPlayForm(false)
                    if (id) void navigate({ to: '/plays/$playId', params: { playId: String(id) } })
                  }}
                  onCancel={() => setShowPlayForm(false)}
                />
              </Card>
            )}

            {canonicalPlays.length > 0 && (
              <LinkedItemList
                items={canonicalPlays.map(p => ({
                  key: p.id,
                  to: '/plays/$playId',
                  params: { playId: String(p.id) },
                  label: p.title,
                  meta: p.date ?? undefined,
                }))}
              />
            )}
            {canonicalPlays.length === 0 && !showPlayForm && (
              <p className="text-sm text-gray-400 italic">No plays yet.</p>
            )}
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete ${fullName}? This will not delete their plays.`}
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deleteAuthor.mutateAsync(author.id)
            void navigate({ to: '/authors' })
          }}
          onCancel={clearDelete}
        />
      )}
    </div>
  )
}
