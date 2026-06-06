import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Dashboard } from '../features/dashboard/components/Dashboard'
import { FullAccessShell } from '../features/shell/components/FullAccessShell'
import { PublicShell } from '../features/shell/components/PublicShell'
import { Welcome } from '../features/free/components/Welcome'

function HomeRoute() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) {
    return (
      <FullAccessShell>
        <Suspense fallback={<div className="p-6 text-gray-500">Loading your dashboard...</div>}>
          <Dashboard />
        </Suspense>
      </FullAccessShell>
    )
  }
  return (
    <PublicShell>
      <Welcome />
    </PublicShell>
  )
}

export const Route = createFileRoute('/')({
  component: HomeRoute,
})
