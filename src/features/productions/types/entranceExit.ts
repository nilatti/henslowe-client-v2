import type { StageExit } from './stageExit'

export interface EntranceExit {
  id: number
  category: 'Enter' | 'Exit'
  french_scene_id: number
  line: number | null
  page: number | null
  notes: string | null
  stage_exit_id: number
  characters: { id: number; name: string }[]
  stage_exit: StageExit
}

export interface EntranceExitUpdatePayload {
  id: number
  category?: 'Enter' | 'Exit'
  line?: number | null
  page?: number | null
  notes?: string | null
  stage_exit_id?: number
  character_ids?: number[]
}
