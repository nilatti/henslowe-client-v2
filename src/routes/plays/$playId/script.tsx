import { createFileRoute, redirect } from '@tanstack/react-router'
import { type RouterContext } from '../../../types/router'

export const Route = createFileRoute('/plays/$playId/script')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: function ScriptPlaceholder() {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-lg font-medium mb-2">Script viewer</p>
        <p className="text-sm">Coming in a future update.</p>
      </div>
    )
  },
})
