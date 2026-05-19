import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { PageHeader } from '../../components/ui'
import { useIsSuperAdmin } from '../../hooks/useUserRole'
import { specializationsQueryOptions } from './queries'
import type { Specialization } from './types'

export function SpecializationsPage() {
  const { data: specializations } = useSuspenseQuery(specializationsQueryOptions())
  const isSuperAdmin = useIsSuperAdmin()

  return (
    <div>
      <PageHeader
        title="Specializations"
        action={
          isSuperAdmin ? (
            <Link
              to="/specializations/new"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Add New
            </Link>
          ) : undefined
        }
      />
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {specializations.length === 0 && (
          <p className="px-4 py-3 text-sm text-gray-500">No specializations found.</p>
        )}
        {specializations.map((s: Specialization) => (
          <Link
            key={s.id}
            to="/specializations/$specializationId"
            params={{ specializationId: String(s.id) }}
            className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
          >
            {s.title}
          </Link>
        ))}
      </div>
    </div>
  )
}
