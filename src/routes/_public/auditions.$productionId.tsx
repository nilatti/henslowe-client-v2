import { Suspense, useEffect, useRef } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { usePageTitle } from '../../hooks/usePageTitle'
import { openAuditionsQueryOptions } from '../../features/auditions/api/auditions'
import { userQueryOptions } from '../../features/users/api/users'
import { AuditionForm } from '../../features/auditions/components/AuditionForm'
import { LoadingSpinner, PageHeader } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const Route = createFileRoute('/_public/auditions/$productionId')({
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
    const { isAuthenticated } = useAuth()
    const redirected = useRef(false)

    usePageTitle(`Audition for ${loaderData.play_title ?? 'Production'}`)

    useEffect(() => {
      if (!isAuthenticated && !redirected.current) {
        redirected.current = true
        localStorage.setItem('redirect_after_login', `/auditions/${loaderData.production_id}`)
        window.location.href = `${VITE_API_URL}/auth/google_oauth2`
      }
    }, [isAuthenticated, loaderData.production_id])

    if (!isAuthenticated) return <LoadingSpinner />

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
