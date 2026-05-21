import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { Welcome } from '../../features/free/components/Welcome'
import { LoadingSpinner } from '../../components/ui'

export const Route = createFileRoute('/free/')({
  component: () => (
    <Suspense fallback={<LoadingSpinner />}>
      <Welcome />
    </Suspense>
  ),
})
