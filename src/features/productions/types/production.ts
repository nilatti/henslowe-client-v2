export interface ProductionListItem {
  id: number
  play: { id: number; title: string }
  theater: { id: number; name: string }
}

export interface Production {
  id: number
  theater_id: number
  start_date: string | null
  end_date: string | null
  lines_per_minute: number | null
  created_at: string
  updated_at: string
  play: { id: number; title: string }
  theater: { id: number; name: string }
}
