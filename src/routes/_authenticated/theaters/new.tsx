import { createFileRoute } from '@tanstack/react-router'
import { NewTheaterPage } from '../../../features/theaters/components/NewTheaterPage'

export const Route = createFileRoute('/_authenticated/theaters/new')({
  component: NewTheaterPage,
})
