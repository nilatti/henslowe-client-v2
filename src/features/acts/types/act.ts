import type { SceneSkeleton } from '../../plays/types/play'

export interface Act {
  id: number
  number: number
  play_id: number
  summary: string | null
  heading: string | null
  start_page: number | null
  end_page: number | null
  original_line_count: number | null
  new_line_count: number | null
  created_at: string
  updated_at: string
}

export interface ActWithScenes extends Act {
  scenes: SceneSkeleton[]
}
