import { createFileRoute } from '@tanstack/react-router'
import { departmentsQueryOptions } from '../../../features/departments/queries'
import { DepartmentsPage } from '../../../features/departments/DepartmentsPage'

export const Route = createFileRoute('/_authenticated/departments/')({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(departmentsQueryOptions()),
  component: DepartmentsPage,
})
