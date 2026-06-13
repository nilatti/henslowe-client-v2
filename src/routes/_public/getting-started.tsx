import { createFileRoute } from '@tanstack/react-router'
import GettingStarted from '../../features/info/components/GettingStarted'
import { usePageTitle } from '../../hooks/usePageTitle'

export const Route = createFileRoute('/_public/getting-started')({
  component: function GettingStartedRoute() {
    usePageTitle('Getting Started')
    return <GettingStarted />
  },
})
