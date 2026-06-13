import { Suspense } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { usePageTitle } from '../../hooks/usePageTitle'
import { openAuditionsQueryOptions } from '../../features/auditions/api/auditions'
import { userQueryOptions } from '../../features/users/api/users'
import { AuditionForm } from '../../features/auditions/components/AuditionForm'
import { LoadingSpinner, PageHeader } from '../../components/ui'

export const Route = createFileRoute('/_authenticated/auditions/$productionId')({
  loader: async ({ params, context: { queryClient, auth } }) => {
    const [auditions] = await Promise.all([
      queryClient.ensureQueryData(openAuditionsQueryOptions()),
      auth.user ? queryClient.ensureQueryData(userQueryOptions(auth.user.id)) : undefined,
    ])
    const productionId = Number(params.productionId)
    const match = auditions.find(a => a.production_id === productionId)
    if (!match) throw notFound()
    return match
  },
  notFoundComponent: () => (
    <div className="max-w-xl mx-auto px-4 py-8">
      <p className="text-gray-600">This production is no longer accepting auditions.</p>
    </div>
  ),
  component: function AuditionFormRoute() {
    const loaderData = Route.useLoaderData()
    usePageTitle(`Audition for ${loaderData.play_title ?? 'Production'}`)

    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <PageHeader title={`Audition for ${loaderData.play_title ?? 'this production'}`} />
        <Suspense fallback={<LoadingSpinner />}>
          <AuditionFormLoader productionId={loaderData.production_id} />
        </Suspense>
      </div>
    )
  },
})

function AuditionFormLoader({ productionId }: { productionId: number }) {
  const { data: auditions } = useSuspenseQuery(openAuditionsQueryOptions())
  const match = auditions.find(a => a.production_id === productionId)!
  return (
    <AuditionForm
      productionId={productionId}
      playTitle={match.play_title}
      theaterName={match.theater_name}
    />
  )
}
