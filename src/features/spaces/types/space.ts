export interface Space {
  id: number
  name: string
  street_address: string | null
  city: string | null
  state: string | null
  zip: string | null
  phone_number: string | null
  website: string | null
  seating_capacity: number | null
  mission_statement: string | null
  logo: string | null
  created_at: string
  updated_at: string
}

export interface SpaceTheater {
  id: number
  name: string
  city: string | null
  state: string | null
}

export interface SpaceConflict {
  id: number
  category: string
  start_date: string
  end_date: string
  start_time: string | null
  end_time: string | null
}

export interface SpaceConflictPattern {
  id: number
  category: string
  days_of_week: string[]
  start_date: string
  end_date: string
  start_time: string | null
  end_time: string | null
}

export interface SpaceDetail extends Space {
  theaters: SpaceTheater[]
  conflicts: SpaceConflict[]
  conflict_patterns: SpaceConflictPattern[]
}
