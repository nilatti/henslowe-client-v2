import { useMemo } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Route } from '../../../../routes/plays/$playId/part-scripts'
import { playScriptQueryOptions } from '../../api/script'
import { productionJobsQueryOptions } from '../../../jobs/api/jobs'
import { ACTOR_SPECIALIZATION_ID } from '../../../../utils/constants'
import type { PlayScript } from '../../types/script'
import type { JobWithDetails } from '../../../jobs/types/job'
import type { ActorWithJobs } from './types'
import _ from 'lodash'
import PartScriptContainer from './PartScriptContainer'

function PaidPartScriptsInner({
  play,
  playId,
  productionId,
}: {
  play: PlayScript
  playId: number
  productionId: number
}) {
  const { data: jobs } = useSuspenseQuery(productionJobsQueryOptions(productionId))

  const actors = useMemo<ActorWithJobs[]>(() => {
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

  return (
    <>
      <div className="mb-4 text-sm">
        Get part scripts for{' '}
        <Link
          to="/plays/$playId"
          params={{ playId: String(playId) }}
          className="text-blue-600 hover:text-blue-800"
        >
          {play.title}
        </Link>
      </div>
      <PartScriptContainer actors={actors} play={play} />
    </>
  )
}

export default function PaidPartScripts() {
  const { playId: playIdStr } = Route.useParams()
  const playId = Number(playIdStr)
  const { data: play } = useSuspenseQuery(playScriptQueryOptions(playId))

  if (!play.production_id) {
    return (
      <p className="text-gray-600 text-sm">
        This play is not linked to a production. Part scripts require a production with cast actors.
      </p>
    )
  }

  return (
    <PaidPartScriptsInner
      play={play}
      playId={playId}
      productionId={play.production_id}
    />
  )
}
