import { createFileRoute } from '@tanstack/react-router'
import { NewPhasePage } from '../../../features/phases/NewPhasePage'

export const Route = createFileRoute('/_authenticated/phases/new')({
  component: NewPhasePage,
})
