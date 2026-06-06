import { createFileRoute, redirect } from '@tanstack/react-router'
import { FullAccessShell } from '../features/shell/components/FullAccessShell'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/' })
    }
  },
  component: FullAccessShell,
})
