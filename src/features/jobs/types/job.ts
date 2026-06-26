import type { UserSummary } from '../../users/types/user'
import type { AuditionSubmission } from '../../auditions/types'

export interface Job {
  id: number
  production_id: number | null
  theater_id: number | null
  user_id: number | null
  specialization_id: number | null
  character_id: number | null
  character_group_id: number | null
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface JobCharacter {
  id: number
  name: string
  new_line_count: number | null
  original_line_count: number | null
}

export interface JobWithDetails extends Job {
  specialization: { id: number; title: string } | null
  theater: { id: number; name: string } | null
  character: JobCharacter | null
  character_group: { id: number; name: string } | null
  production: {
    id: number
    play: { id: number; title: string } | null
  } | null
  user: (UserSummary & {
    fake: boolean
    subscription_status?: string
    paid_override?: boolean
    gender: string | null
    middle_name?: string | null
    phone_number?: string | null
    timezone?: string | null
    bio?: string | null
    street_address?: string | null
    city?: string | null
    state?: string | null
    zip?: string | null
    website?: string | null
    emergency_contact_name?: string | null
    emergency_contact_number?: string | null
    conflicts?: unknown[]
    jobs?: unknown[]
  }) | null
  audition_submission: AuditionSubmission | null
}

export interface FakeActorCount {
  female: number
  male: number
  nonbinary: number
}
