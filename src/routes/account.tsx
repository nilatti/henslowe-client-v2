import { createFileRoute, redirect } from '@tanstack/react-router'
import IndividualAccount from '../features/billing/components/IndividualAccount'
import { type RouterContext } from '../types/router'

export const Route = createFileRoute('/account')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: IndividualAccount,
})
