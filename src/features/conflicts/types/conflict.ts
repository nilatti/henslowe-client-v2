export interface Conflict {
  id: number
  user_id: number | null
  space_id: number | null
  start_time: string
  end_time: string
  category: string
  regular: boolean
  conflict_pattern_id: number | null
  created_at: string
  updated_at: string
}

export interface ConflictPattern {
  id: number
  user_id: number | null
  space_id: number | null
  start_time: string  // time string, e.g. "18:00:00"
  end_time: string
  start_date: string
  end_date: string
  category: string
  days_of_week: string  // JSON string: '["monday","tuesday"]'
  created_at: string
  updated_at: string
}
