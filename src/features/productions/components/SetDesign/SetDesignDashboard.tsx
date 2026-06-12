import { Suspense } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
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
      <div className="text-sm text-gray-500 italic">Coming soon: Design renderings</div>
      <div className="text-sm text-gray-500 italic">Coming soon: Build list</div>

      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-3">Stage Exits</h3>
        <Suspense fallback={<LoadingSpinner />}>
          <StageExitsList productionId={productionId} theaterId={production.theater.id} />
        </Suspense>
      </div>
    </div>
  )
}
