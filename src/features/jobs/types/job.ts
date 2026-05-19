import type { UserSummary } from '../../users/types/user'

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
    gender: string | null
    conflicts?: unknown[]
    jobs?: unknown[]
  }) | null
}

export interface FakeActorCount {
  female: number
  male: number
  nonbinary: number
}
