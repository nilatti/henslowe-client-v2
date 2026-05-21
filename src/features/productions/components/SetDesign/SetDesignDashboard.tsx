import { Suspense } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { productionSkeletonQueryOptions } from '../../api/productions'
import { StageExitsList } from './StageExitsList'
import { LoadingSpinner } from '../../../../components/ui'

interface SetDesignDashboardProps {
  productionId: number
}

export function SetDesignDashboard({ productionId }: SetDesignDashboardProps) {
  const { data: production } = useSuspenseQuery(
    productionSkeletonQueryOptions(productionId)
  )

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">
        Set Design Dashboard for{' '}
        <Link
          to="/productions/$productionId"
          params={{ productionId: String(productionId) }}
          className="text-blue-600 hover:text-blue-800"
        >
          {production.play.title}
        </Link>{' '}
        at{' '}
        <Link
          to="/theaters/$theaterId"
          params={{ theaterId: String(production.theater.id) }}
          className="text-blue-600 hover:text-blue-800"
        >
          {production.theater.name}
        </Link>
      </h2>

      <div className="text-sm text-gray-500 italic">Coming soon: Design renderings</div>
      <div className="text-sm text-gray-500 italic">Coming soon: Build list</div>

      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-3">Stage Exits</h3>
        <Suspense fallback={<LoadingSpinner />}>
          <StageExitsList productionId={productionId} />
        </Suspense>
      </div>
    </div>
  )
}
