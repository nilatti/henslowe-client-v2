import type { Phase } from '../../phases/types'

export interface ProductionPhase {
  id: number
  production_id: number
  phase_id: number
  start_date: string | null
  end_date: string | null
  phase: Phase
}

export interface ProductionListItem {
  id: number
  play: { id: number; title: string }
  theater: { id: number; name: string }
}

export interface ProductionDefaultCallUser {
  id: number
  first_name: string | null
  last_name: string | null
  preferred_name: string | null
  email: string
  fake: boolean
}

export interface Production {
  id: number
  theater_id: number
  start_date: string | null
  end_date: string | null
  lines_per_minute: number | null
  audition_information: string | null
  created_at: string
  updated_at: string
  play: { id: number; title: string; has_lines: boolean }
  theater: { id: number; name: string }
  default_space_id: number | null
  default_space: { id: number; name: string } | null
  default_call_users: ProductionDefaultCallUser[]
  default_call_user_ids: number[]
  production_phases: ProductionPhase[]
}
