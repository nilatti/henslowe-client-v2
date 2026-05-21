import { Suspense } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { type RouterContext } from '../../../../types/router'
import { LoadingSpinner } from '../../../../components/ui'
import CharactersBreakdown from '../../../../features/script/components/Characters/CharactersBreakdown'

export const Route = createFileRoute('/plays/$playId/characters/')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) throw redirect({ to: '/login' })
  },
  component: CharactersRouteComponent,
})

function CharactersRouteComponent() {
  const { playId } = Route.useParams()
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CharactersBreakdown playId={Number(playId)} />
    </Suspense>
  )
}
