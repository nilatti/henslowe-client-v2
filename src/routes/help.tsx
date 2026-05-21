import { createFileRoute } from '@tanstack/react-router'
import Help from '../features/info/components/Help'

export const Route = createFileRoute('/help')({
  component: Help,
})
