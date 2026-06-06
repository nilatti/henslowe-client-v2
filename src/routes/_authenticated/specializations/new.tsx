import { createFileRoute } from '@tanstack/react-router'
import { NewSpecializationPage } from '../../../features/specializations/NewSpecializationPage'

export const Route = createFileRoute('/_authenticated/specializations/new')({
  component: NewSpecializationPage,
})
