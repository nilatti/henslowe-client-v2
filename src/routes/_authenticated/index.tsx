import { createFileRoute } from '@tanstack/react-router'
import { Dashboard } from '../../features/dashboard/components/Dashboard'

export const Route = createFileRoute('/_authenticated/')({
  component: Dashboard,
  pendingComponent: () => (
    <div className="p-6 text-gray-500">Loading your dashboard...</div>
  ),
})
