import { createFileRoute, redirect } from '@tanstack/react-router'
import { type RouterContext } from '../../types/router'
import { NewSpecializationPage } from '../../features/specializations/NewSpecializationPage'

export const Route = createFileRoute('/specializations/new')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.isAuthenticated) throw redirect({ to: '/login' })
  },
  component: NewSpecializationPage,
})
