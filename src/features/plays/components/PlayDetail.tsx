import { useState } from 'react'
import { useSuspenseQuery, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { playSkeletonQueryOptions, useDeletePlay } from '../api/plays'
import { productionSkeletonQueryOptions } from '../../productions/api/productions'
import { PlayForm } from './PlayForm'
import CharactersBreakdown from '../../script/components/Characters/CharactersBreakdown'
import { ActsTab } from '../../acts/components/ActsTab'
import { getScenes, getAllCharacters } from '../types/play'
import { useIsPlayAdmin } from '../../../hooks/useUserRole'
import {
  Button,
  Card,
  ConfirmDialog,
  PageHeader,
  Tabs,
} from '../../../components/ui'

interface PlayDetailProps {
  playId: number
}

export function PlayDetail({ playId }: PlayDetailProps) {
  const { data: play } = useSuspenseQuery(playSkeletonQueryOptions(playId))
  usePageTitle(play.title)
  const deletePlay = useDeletePlay()
  const isAdmin = useIsPlayAdmin(playId)
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('info')
  const [isEditing, setIsEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isProductionCopy = !play.canonical && !!play.production_id
  const { data: productionSkeleton } = useQuery({
    ...productionSkeletonQueryOptions(play.production_id ?? 0),
    enabled: isProductionCopy,
  })

  const scenes = getScenes(play)
  const allCharacters = getAllCharacters(play)
  const hasLines = play.characters.some(c => (c.original_line_count ?? 0) > 0)

  const tabs = [
    { id: 'info', label: 'Info' },
    { id: 'structure', label: `Structure (${play.acts.length} acts, ${scenes.length} scenes)` },
    { id: 'characters', label: `Characters (${allCharacters.length})` },
  ]

  return (
    <div>
      <PageHeader
        title={play.title}
        action={
          isAdmin && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            </div>
          )
        }
      />

      {isEditing ? (
        <Card className="p-6 mb-6">
          <PlayForm
            play={play}
            onSuccess={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        </Card>
      ) : (
        <>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'info' && (
            <Card className="p-6">
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-gray-700">Author</dt>
                  <dd className="mt-1">
                    <Link
                      to="/authors/$authorId"
                      params={{ authorId: String(play.author.id) }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {play.author.first_name} {play.author.last_name}
                    </Link>
                  </dd>
                </div>
                {play.synopsis && (
                  <div>
                    <dt className="font-medium text-gray-700">Synopsis</dt>
                    <dd className="text-gray-600 mt-1 leading-relaxed">
                      {play.synopsis}
                    </dd>
                  </div>
                )}
                {play.text_notes && (
                  <div>
                    <dt className="font-medium text-gray-700">Text notes</dt>
                    <dd className="text-gray-600 mt-1 leading-relaxed">
                      {play.text_notes}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="font-medium text-gray-700">Type</dt>
                  <dd className="text-gray-600 mt-1">
                    {play.canonical ? 'Canonical' : 'Production copy'}
                  </dd>
                </div>
                {isProductionCopy && play.production_id && (
                  <div>
                    <dt className="font-medium text-gray-700">Production</dt>
                    <dd className="mt-1">
                      <Link
                        to="/productions/$productionId"
                        params={{ productionId: String(play.production_id) }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {productionSkeleton?.theater.name ?? 'View production'}
                      </Link>
                    </dd>
                  </div>
                )}
                <div className="pt-2 flex gap-3 flex-wrap">
                  {hasLines && (
                    <Link
                      to="/plays/$playId/script"
                      params={{ playId: String(playId) }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View script →
                    </Link>
                  )}
                  {hasLines && (
                    <Link
                      to="/plays/$playId/part-scripts"
                      params={{ playId: String(playId) }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Part scripts →
                    </Link>
                  )}
                  <Link
                    to="/plays/$playId/word-clouds"
                    params={{ playId: String(playId) }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Word clouds →
                  </Link>
                </div>
              </dl>
            </Card>
          )}

          {activeTab === 'structure' && (
            <ActsTab play={play} playId={playId} />
          )}

          {activeTab === 'characters' && (
            <CharactersBreakdown playId={playId} embedded />
          )}
        </>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete "${play.title}"? This will delete all acts, scenes, characters and lines. This cannot be undone.`}
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deletePlay.mutateAsync(playId)
            navigate({ to: '/plays' })
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
