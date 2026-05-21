import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { CutPlays } from '../../features/free/components/CutPlays'
import { LoadingSpinner } from '../../components/ui'

export const Route = createFileRoute('/free/cut')({
  component: () => (
    <Suspense fallback={<LoadingSpinner />}>
      <CutPlays />
    </Suspense>
  ),
})
