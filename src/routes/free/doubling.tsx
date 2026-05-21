import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { Double } from '../../features/free/components/Double'
import { LoadingSpinner } from '../../components/ui'

export const Route = createFileRoute('/free/doubling')({
  component: () => (
    <Suspense fallback={<LoadingSpinner />}>
      <Double />
    </Suspense>
  ),
})
