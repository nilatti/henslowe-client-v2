import { createFileRoute } from '@tanstack/react-router'
import AboutHenslowesCloud from '../features/info/components/AboutHenslowesCloud'

export const Route = createFileRoute('/about')({
  component: AboutHenslowesCloud,
})
