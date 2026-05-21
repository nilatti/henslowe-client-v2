import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { WordCloud } from '../../features/free/components/WordCloud'
import { LoadingSpinner } from '../../components/ui'

export const Route = createFileRoute('/free/word-cloud')({
  component: () => (
    <Suspense fallback={<LoadingSpinner />}>
      <WordCloud />
    </Suspense>
  ),
})
