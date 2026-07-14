import { createFileRoute } from '@tanstack/react-router'
import { departmentQueryOptions } from '../../../features/departments/queries'
import { DepartmentDetailPage } from '../../../features/departments/DepartmentDetailPage'

export const Route = createFileRoute('/_authenticated/departments/$departmentId')({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(
      departmentQueryOptions(Number(params.departmentId))
    ),
  component: function DepartmentDetailRoute() {
    const { departmentId } = Route.useParams()
    return <DepartmentDetailPage departmentId={Number(departmentId)} />
  },
})
