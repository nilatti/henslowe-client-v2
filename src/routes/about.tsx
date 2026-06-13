import { createFileRoute } from '@tanstack/react-router'
import AboutHenslowesCloud from '../features/info/components/AboutHenslowesCloud'
import { usePageTitle } from '../hooks/usePageTitle'

export const Route = createFileRoute('/about')({
  component: function AboutRoute() {
    usePageTitle('About')
    return <AboutHenslowesCloud />
  },
})
