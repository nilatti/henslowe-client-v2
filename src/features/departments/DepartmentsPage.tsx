import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Button, PageHeader } from '../../components/ui'
import { useIsSuperAdmin } from '../../hooks/useUserRole'
import { departmentsQueryOptions } from './queries'
import type { Department } from './types'

export function DepartmentsPage() {
  const { data: departments } = useSuspenseQuery(departmentsQueryOptions())
  const isSuperAdmin = useIsSuperAdmin()

  return (
    <div>
      <PageHeader
        title="Departments"
        action={
          isSuperAdmin ? (
            <Link to="/departments/new" className="inline-block">
              <Button>New Department</Button>
            </Link>
          ) : undefined
        }
      />
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {departments.length === 0 && (
          <p className="px-4 py-3 text-sm text-gray-500">No departments found.</p>
        )}
        {departments.map((d: Department) => (
          <Link
            key={d.id}
            to="/departments/$departmentId"
            params={{ departmentId: String(d.id) }}
            className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
          >
            {d.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
