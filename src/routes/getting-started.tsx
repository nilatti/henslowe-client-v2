import { createFileRoute } from '@tanstack/react-router'
import GettingStarted from '../features/info/components/GettingStarted'

export const Route = createFileRoute('/getting-started')({
  component: GettingStarted,
})
