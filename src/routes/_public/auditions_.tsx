import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { usePageTitle } from '../../hooks/usePageTitle'
import { OpenAuditionsList } from '../../features/auditions/components/OpenAuditionsList'
import { LoadingSpinner, PageHeader } from '../../components/ui'

export const Route = createFileRoute('/_public/auditions_')({
  component: function AuditionsRoute() {
    usePageTitle('Open Auditions')
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <PageHeader title="Open Auditions" />
        <Suspense fallback={<LoadingSpinner />}>
          <OpenAuditionsList />
        </Suspense>
      </div>
    )
  },
})
