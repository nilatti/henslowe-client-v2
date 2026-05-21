import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { Casting } from '../../features/free/components/Casting'
import { LoadingSpinner } from '../../components/ui'

export const Route = createFileRoute('/free/casting')({
  component: () => (
    <Suspense fallback={<LoadingSpinner />}>
      <Casting />
    </Suspense>
  ),
})
