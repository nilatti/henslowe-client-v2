import type { UserDetail, UserJob } from '../../users/types/user'

export interface DashboardRehearsal {
  id: number
  start_time: string
  end_time: string
  space?: { name: string }
  title?: string
  notes?: string
  acts?: { heading: string }[]
  french_scenes?: { pretty_name: string }[]
  scenes?: { pretty_name: string }[]
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
