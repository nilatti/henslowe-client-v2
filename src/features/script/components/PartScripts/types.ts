export interface ActorWithJobs {
  id: number
  email: string
  first_name?: string | null
  last_name?: string | null
  preferred_name?: string | null
  fake?: boolean
  jobs: Array<{ character_id: number }>
}

export interface PartLine {
  number: string
  original_content: string
  new_content?: string | null
  character_id?: number | null
  character?: { id: number; name: string } | null
}

export interface PartText {
  lines: PartLine[]
  stage_directions: PartLine[]
  sound_cues: PartLine[]
}
