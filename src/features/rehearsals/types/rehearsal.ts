export interface Rehearsal {
  id: number
  production_id: number
  space_id: number | null
  space: { id: number; name: string } | null
  start_time: string
  end_time: string
  title: string | null
  notes: string | null
  text_unit: 'acts' | 'scenes' | 'french_scenes' | null
  created_at: string
  updated_at: string
}

export interface RehearsalUser {
  id: number
  first_name: string
  last_name: string
  email: string
  fake: boolean
  preferred_name?: string | null
}

export interface RehearsalTextUnit {
  id: number
  number: number | string
  pretty_name?: string
  heading?: string
  start_page?: number | null
  end_page?: number | null
  play_id?: number
  act_id?: number
  scene_id?: number
  scene?: { id: number; act_id: number }
  find_on_stages?: { user_id: number | null }[]
}

export interface RehearsalWithDetails extends Rehearsal {
  users: RehearsalUser[]
  acts: RehearsalTextUnit[]
  scenes: RehearsalTextUnit[]
  french_scenes: RehearsalTextUnit[]
}

export interface RehearsalSchedulePattern {
  days_of_week: string[]
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  block_length?: number
  break_length?: number
  time_between_breaks?: number
  default_user_ids: number[]
}
