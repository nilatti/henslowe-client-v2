import { createFileRoute } from '@tanstack/react-router'
import GettingStarted from '../../features/info/components/GettingStarted'

export const Route = createFileRoute('/_public/getting-started')({
  component: GettingStarted,
})
