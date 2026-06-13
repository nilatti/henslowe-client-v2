import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { openAuditionsQueryOptions } from '../api/auditions'
import { useAuth } from '../../../hooks/useAuth'
import { Button } from '../../../components/ui'

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) return null
  const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  if (start && end) return `${fmt(start)} – ${fmt(end)}`
  if (start) return `Starting ${fmt(start)}`
  return `Until ${fmt(end!)}`
}

export function OpenAuditionsList() {
  const { data: auditions } = useSuspenseQuery(openAuditionsQueryOptions())
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  function handleAudition(productionId: number) {
    if (isAuthenticated) {
      navigate({ to: '/auditions/$productionId', params: { productionId: String(productionId) } })
    } else {
      sessionStorage.setItem('redirect_after_login', `/auditions/${productionId}`)
      window.location.href = `${VITE_API_URL}/auth/google_oauth2`
    }
  }

  if (auditions.length === 0) {
    return (
      <p className="text-gray-500 text-sm">No productions are currently holding open auditions.</p>
    )
  }

  return (
    <ul className="space-y-4">
      {auditions.map(a => {
        const dateRange = formatDateRange(a.audition_start_date, a.audition_end_date)
        const location = [a.theater_city, a.theater_state].filter(Boolean).join(', ')
        return (
          <li key={a.production_id} className="border rounded-lg p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">{a.play_title ?? 'Untitled Production'}</p>
              <p className="text-sm text-gray-600">{a.theater_name}{location ? ` · ${location}` : ''}</p>
              {dateRange && <p className="text-sm text-gray-500 mt-0.5">Auditions: {dateRange}</p>}
            </div>
            <Button onClick={() => handleAudition(a.production_id)}>
              Audition
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
