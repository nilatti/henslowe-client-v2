import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useCreateJob } from '../../jobs/api/jobs'
import { specializationsQueryOptions } from '../../specializations/queries'
import { theatersQueryOptions } from '../../theaters/api/theaters'
import { productionsQueryOptions } from '../../productions/api/productions'
import { userAllJobsQueryOptions } from '../../../hooks/useUserRole'
import { theatersWhereUserIsAdmin, productionsWhereUserIsAdmin } from '../../../utils/authorizationUtils'
import { useAuth } from '../../../hooks/useAuth'
import { Button } from '../../../components/ui'

interface Props {
  userId: number
  invalidateKey: unknown[]
  onSuccess: () => void
  onCancel: () => void
}

export function AddJobToUserForm({ userId, invalidateKey, onSuccess, onCancel }: Props) {
  const { user: currentUser } = useAuth()
  const create = useCreateJob(invalidateKey)

  const { data: allJobs = [] } = useQuery(userAllJobsQueryOptions(currentUser!.id))
  const { data: theaters = [] } = useQuery(theatersQueryOptions())
  const { data: productions = [] } = useQuery(productionsQueryOptions())
  const { data: specializations = [] } = useQuery(specializationsQueryOptions())

  const today = format(new Date(), 'yyyy-MM-dd')
  const [context, setContext] = useState('')
  const [specializationId, setSpecializationId] = useState(0)
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isSuperAdmin = currentUser?.is_superadmin === true
  const userWithJobs = { id: currentUser!.id, is_superadmin: isSuperAdmin, jobs: allJobs as any[] }

  const adminTheaters = isSuperAdmin
    ? theaters
    : theatersWhereUserIsAdmin(userWithJobs, theaters) as typeof theaters

  const productionsWithTheaterId = productions.map(p => ({
    id: p.id,
    theater_id: p.theater?.id,
    play: p.play,
  }))
  const adminProductionIds = new Set(
    productionsWhereUserIsAdmin(userWithJobs, productionsWithTheaterId).map(p => p.id)
  )
  const adminProductions = isSuperAdmin
    ? productions
    : productions.filter(p => adminProductionIds.has(p.id))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!context || !specializationId) return
    const [type, idStr] = context.split(':')
    setSubmitting(true)
    try {
      await create.mutateAsync({
        user_id: userId,
        specialization_id: specializationId,
        theater_id: type === 'theater' ? Number(idStr) : null,
        production_id: type === 'production' ? Number(idStr) : null,
        start_date: startDate || null,
        end_date: endDate || null,
      })
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-gray-200 rounded-md bg-gray-50 mt-3">
      <h4 className="text-sm font-semibold text-gray-800">Add job</h4>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Theater or production *
        </label>
        <select
          value={context}
          onChange={e => setContext(e.target.value)}
          required
          className={inputClass}
        >
          <option value="">Select...</option>
          {adminTheaters.length > 0 && (
            <optgroup label="Theaters">
              {adminTheaters.map(t => (
                <option key={t.id} value={`theater:${t.id}`}>{t.name}</option>
              ))}
            </optgroup>
          )}
          {adminProductions.length > 0 && (
            <optgroup label="Productions">
              {adminProductions.map(p => (
                <option key={p.id} value={`production:${p.id}`}>
                  {p.play?.title ?? `Production ${p.id}`}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
        <select
          value={specializationId}
          onChange={e => setSpecializationId(Number(e.target.value))}
          required
          className={inputClass}
        >
          <option value={0}>Select role</option>
          {[...specializations].sort((a, b) => a.title.localeCompare(b.title)).map(s => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || !context || !specializationId}>
          {submitting ? 'Saving...' : 'Add job'}
        </Button>
      </div>
    </form>
  )
}
