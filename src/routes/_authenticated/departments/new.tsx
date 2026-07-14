import { createFileRoute } from '@tanstack/react-router'
import { NewDepartmentPage } from '../../../features/departments/NewDepartmentPage'

export const Route = createFileRoute('/_authenticated/departments/new')({
  component: NewDepartmentPage,
})
