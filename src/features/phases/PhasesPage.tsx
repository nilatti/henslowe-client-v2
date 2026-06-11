import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Button, PageHeader } from '../../components/ui'
import { phasesQueryOptions } from './queries'

export function PhasesPage() {
  const { data: phases } = useSuspenseQuery(phasesQueryOptions())

  return (
    <div>
      <PageHeader
        title="Phases"
        action={
          <Link to="/phases/new" className="inline-block">
            <Button>New Phase</Button>
          </Link>
        }
      />
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {phases.length === 0 && (
          <p className="px-4 py-3 text-sm text-gray-500">No phases defined yet.</p>
        )}
        {phases.map(phase => (
          <Link
            key={phase.id}
            to="/phases/$phaseId"
            params={{ phaseId: String(phase.id) }}
            className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
          >
            {phase.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
