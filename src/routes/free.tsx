import { createFileRoute } from '@tanstack/react-router'
import { PublicShell } from '../features/shell/components/PublicShell'

export const Route = createFileRoute('/free')({
  component: PublicShell,
})
