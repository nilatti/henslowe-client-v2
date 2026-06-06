import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Route } from '../../../../routes/_authenticated/plays/$playId/word-clouds'
import { playScriptQueryOptions } from '../../api/script'
import WordCloudContainer from './WordCloudContainer'

export default function PaidWordClouds() {
  const { playId: playIdStr } = Route.useParams()
  const playId = Number(playIdStr)
  const { data: play } = useSuspenseQuery(playScriptQueryOptions(playId))

  return (
    <>
      <div className="mb-4 text-sm">
        Make a word cloud for{' '}
        <Link
          to="/plays/$playId"
          params={{ playId: String(playId) }}
          className="text-blue-600 hover:text-blue-800"
        >
          {play.title}
        </Link>
      </div>
      <WordCloudContainer play={play} />
    </>
  )
}
