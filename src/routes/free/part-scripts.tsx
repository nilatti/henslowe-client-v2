import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { PartScripts } from '../../features/free/components/PartScripts'
import { LoadingSpinner } from '../../components/ui'

export const Route = createFileRoute('/free/part-scripts')({
  component: () => (
    <Suspense fallback={<LoadingSpinner />}>
      <PartScripts />
    </Suspense>
  ),
})
