import { useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import _ from 'lodash'
import { productionSkeletonQueryOptions } from '../../../../features/productions/api/productions'
import { playScriptQueryOptions } from '../../../../features/script/api/script'
import { productionJobsQueryOptions } from '../../../../features/jobs/api/jobs'
import { ExportButtons } from '../../../../features/script/components/ExportButtons'
import PartScriptContainer from '../../../../features/script/components/PartScripts/PartScriptContainer'
import { PartScriptExportButtons } from '../../../../features/script/components/PartScripts/PartScriptExportButtons'
import { ACTOR_SPECIALIZATION_ID } from '../../../../utils/constants'
import type { JobWithDetails } from '../../../../features/jobs/types/job'
import { Card } from '../../../../components/ui'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner'

export const Route = createFileRoute('/_authenticated/productions/$productionId/script')({
  loader: async ({ params, context: { queryClient } }) => {
    const pid = Number(params.productionId)
    const production = await queryClient.ensureQueryData(productionSkeletonQueryOptions(pid))
    const playId = production.play?.id
    if (playId) {
      await Promise.all([
        queryClient.ensureQueryData(playScriptQueryOptions(playId)),
        queryClient.ensureQueryData(productionJobsQueryOptions(pid)),
      ])
    }
  },
  pendingComponent: () => <LoadingSpinner message="Loading script…" />,
  component: function ScriptRoute() {
    const { productionId } = Route.useParams()
    const pid = Number(productionId)
    const { data: production } = useSuspenseQuery(productionSkeletonQueryOptions(pid))
    const playId = production.play?.id ?? 0
    const hasLines = production.play?.has_lines ?? false

    if (!hasLines) {
      return (
        <Card className="p-4 space-y-3">
          <p className="text-sm text-gray-500 text-center">
            No script has been added to this production yet.
          </p>
          <div className="flex justify-center">
            <Link
              to="/plays/$playId"
              params={{ playId: String(playId) }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Play structure →
            </Link>
          </div>
        </Card>
      )
    }

    return <ScriptContent productionId={pid} playId={playId} playTitle={production.play?.title ?? ''} />
  },
})

function ScriptContent({
  productionId,
  playId,
  playTitle,
}: {
  productionId: number
  playId: number
  playTitle: string
}) {
  const { data: play } = useSuspenseQuery(playScriptQueryOptions(playId))
  const { data: jobs } = useSuspenseQuery(productionJobsQueryOptions(productionId))

  const actors = useMemo(() => {
    const actorJobs = jobs.filter(j => j.specialization_id === ACTOR_SPECIALIZATION_ID)
    const users = actorJobs
      .map(j => j.user)
      .filter((u): u is NonNullable<JobWithDetails['user']> => u != null)
    return _.uniqBy(users, 'id').map(u => ({
      ...u,
      jobs: actorJobs
        .filter(j => j.user_id === u.id)
        .map(j => ({ character_id: j.character_id }))
        .filter((j): j is { character_id: number } => j.character_id != null),
    }))
  }, [jobs])

  const scriptLinks = [
    { to: '/plays/$playId', label: 'Play structure' },
    { to: '/plays/$playId/script', label: 'View/edit script' },
    { to: '/plays/$playId/part-scripts', label: 'Part scripts' },
    { to: '/plays/$playId/word-clouds', label: 'Word clouds' },
  ] as const

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {scriptLinks.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            params={{ playId: String(playId) }}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            {label} →
          </Link>
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Download Scripts</h2>
        <p className="text-sm text-gray-500">
          Cut script removes all cut lines; marked script shows cuts as strikethroughs and
          edits as underlines. Downloads one act at a time.
        </p>
        {play.acts.map(act => (
          <div key={act.id} className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 w-14 shrink-0">
              Act {act.number}
            </span>
            <ExportButtons act={act} playTitle={playTitle} />
          </div>
        ))}
      </section>

      <hr />

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Download Part Scripts</h2>
        <p className="text-sm text-gray-500">
          Cut script removes all cut lines; marked script shows cuts as strikethroughs and
          edits as underlines. Select an actor or character to download their part script.
        </p>
        <PartScriptExportButtons play={play} actors={actors} />
      </section>

      <hr />

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Part Scripts</h2>
        <p className="text-sm text-gray-500">
          Preview a part script showing only an actor's lines with a few words of cue.
        </p>
        <PartScriptContainer actors={actors} play={play} />
      </section>
    </div>
  )
}
