import type { PlayScript } from '../../script/types/script'
import type { PlaySkeleton } from '../../plays/types/play'

export interface FakeActorCounts {
  female: number
  male: number
  nonbinary: number
}

export interface FakeActor {
  id: number
  email: string
  first_name: string
  last_name: string
  fake: true
  jobs: FreeCasting[]
}

export interface FreeCasting {
  character_id: number
  character: { id: number; name: string; new_line_count?: number | null; original_line_count?: number | null }
  user?: FakeActor
  // user_id derived from user.id for DoublingChartShow compatibility
  user_id?: number
}

export type { PlayScript, PlaySkeleton }
