import { createFileRoute, redirect } from '@tanstack/react-router'
import { type RouterContext } from '../../../../types/router'

export const Route = createFileRoute('/plays/$playId/characters/')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) throw redirect({ to: '/login' })
  },
  component: () => <div>Characters — coming soon</div>,
})
