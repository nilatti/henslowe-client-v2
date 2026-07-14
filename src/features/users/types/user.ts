// Minimal user — returned in nested contexts (jobs, rehearsals etc.)
export interface UserSummary {
  id: number
  email: string
  first_name: string
  last_name: string
  preferred_name: string | null
  program_name: string | null
  subscription_status?: string
  paid_override?: boolean
  fake?: boolean
}

// Full user — returned by show action, fields vary by overlap level
export interface UserDetail {
  id: number
  email?: string
  first_name: string
  middle_name?: string | null
  last_name: string
  preferred_name?: string | null
  program_name?: string | null
  phone_number?: string | null
  birthdate?: string | null
  timezone?: string | null
  gender?: string | null
  bio?: string | null
  description?: string | null
  street_address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  website?: string | null
  emergency_contact_name?: string | null
  emergency_contact_number?: string | null
  receive_rehearsal_calendar_invites?: boolean
  fake?: boolean
  role?: string
  subscription_status?: string
  subscription_end_date?: string | null
  paid_override?: boolean
  created_at?: string
  updated_at?: string
  headshot_url?: string | null
  resume_url?: string | null
  // Relationship level between the viewer and this user
  overlap?: string
  // Included when overlap level is sufficient
  jobs?: UserJob[]
  conflicts?: UserConflict[]
  conflict_patterns?: UserConflictPattern[]
  rehearsals?: UserRehearsal[]
}

export interface UserJob {
  id: number
  production_id: number | null
  theater_id: number | null
  start_date: string | null
  end_date: string | null
  specialization?: { title: string }
  theater?: { id: number, name: string }
  production?: {
    id: number
    play?: { id: number, title: string }
    theater?: { id: number, name: string }
  }
  character?: { name: string } | null
  character_group?: { name: string } | null
  audition_submission?: { id: number; video_url: string | null; notes: string | null } | null
}

export interface UserConflict {
  id: number
  category: string
  start_date: string
  end_date: string
  start_time: string | null
  end_time: string | null
}

export interface UserConflictPattern {
  id: number
  category: string
  days_of_week: string[]
  start_date: string
  end_date: string
  start_time: string | null
  end_time: string | null
}

export interface UserRehearsal {
  id: number
  start_time: string
  end_time: string
}

// Fields the current user can edit on their own profile
export interface UserEditableFields {
  bio: string
  birthdate: string
  city: string
  description: string
  emergency_contact_name: string
  emergency_contact_number: string
  first_name: string
  gender: string
  email: string
  last_name: string
  middle_name: string
  phone_number: string
  preferred_name: string
  program_name: string
  receive_rehearsal_calendar_invites: boolean
  state: string
  street_address: string
  timezone: string
  website: string
  zip: string
}
