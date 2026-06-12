import type { UserDetail, UserJob } from '../../users/types/user'

export interface DashboardRehearsal {
  id: number
  production_id: number
  start_time: string
  end_time: string
  space?: { id: number; name: string }
  title?: string
  notes?: string
  acts?: { id: number; play_id: number; heading: string }[]
  french_scenes?: { id: number; scene_id: number; pretty_name: string; scene: { id: number; act_id: number } }[]
  scenes?: { id: number; act_id: number; pretty_name: string }[]
  users: {
    id: number
    email: string
    first_name?: string
    last_name?: string
    preferred_name?: string | null
    fake?: boolean
    conflicts?: { start_time: string; end_time: string }[]
  }[]
}

export type DashboardUser = Omit<UserDetail, 'rehearsals' | 'jobs'> & {
  email: string
  jobs: UserJob[]
  rehearsals: DashboardRehearsal[]
}
