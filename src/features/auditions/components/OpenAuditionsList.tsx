import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { openAuditionsQueryOptions } from '../api/auditions'
import { userQueryOptions } from '../../users/api/users'
import { useAuth } from '../../../hooks/useAuth'
import { Button } from '../../../components/ui'
import type { OpenAudition } from '../types'
import type { UserDetail } from '../../users/types/user'

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
  const { isAuthenticated, user } = useAuth()

  if (auditions.length === 0) {
    return (
      <p className="text-gray-500 text-sm">No productions are currently holding open auditions.</p>
    )
  }

  if (isAuthenticated && user) {
    return <AuthenticatedList auditions={auditions} userId={user.id} />
  }

  return <UnauthenticatedList auditions={auditions} />
}

function AuthenticatedList({ auditions, userId }: { auditions: OpenAudition[]; userId: number }) {
  const { data: profile } = useSuspenseQuery(userQueryOptions(userId))
  return <AuditionRows auditions={auditions} profile={profile} />
}

function UnauthenticatedList({ auditions }: { auditions: OpenAudition[] }) {
  return <AuditionRows auditions={auditions} profile={null} />
}

function AuditionRows({ auditions, profile }: { auditions: OpenAudition[]; profile: UserDetail | null }) {
  const navigate = useNavigate()

  function auditionerJob(productionId: number) {
    return profile?.jobs?.find(
      j => j.production_id === productionId && j.specialization?.title === 'Auditioner'
    ) ?? null
  }

  function handleAudition(productionId: number) {
    if (profile) {
      navigate({ to: '/auditions/$productionId', params: { productionId: String(productionId) } })
    } else {
      localStorage.setItem('redirect_after_login', `/auditions/${productionId}`)
      window.location.href = `${VITE_API_URL}/auth/google_oauth2`
    }
  }

  return (
    <ul className="space-y-4">
      {auditions.map(a => {
        const dateRange = formatDateRange(a.audition_start_date, a.audition_end_date)
        const location = [a.theater_city, a.theater_state].filter(Boolean).join(', ')
        const job = auditionerJob(a.production_id)
        const applied = !!job
        const videoUrl = job?.audition_submission?.video_url
        return (
          <li key={a.production_id} className="border rounded-lg p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">{a.play_title ?? 'Untitled Production'}</p>
              <p className="text-sm text-gray-600">{a.theater_name}{location ? ` · ${location}` : ''}</p>
              {dateRange && <p className="text-sm text-gray-500 mt-0.5">Auditions: {dateRange}</p>}
              {videoUrl && (
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline mt-0.5 inline-block"
                >
                  View submitted video
                </a>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {applied && (
                <span className="text-sm text-green-700 font-medium bg-green-50 border border-green-200 rounded-full px-3 py-1">
                  Applied
                </span>
              )}
              <Button
                onClick={() => handleAudition(a.production_id)}
                variant={applied ? 'secondary' : 'primary'}
              >
                {applied ? 'Update' : 'Audition'}
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
