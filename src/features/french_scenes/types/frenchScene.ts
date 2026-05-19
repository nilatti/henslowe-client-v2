export interface FrenchScene {
  id: number
  number: string  // alphabetic: "a", "b", "c"
  scene_id: number
  summary: string | null
  start_page: number | null
  end_page: number | null
  original_line_count: number | null
  new_line_count: number | null
  pretty_name?: string
  created_at: string
  updated_at: string
}

export interface OnStageCharacter {
  id: number
  name: string
}

export interface OnStage {
  id: number
  french_scene_id: number
  character_id: number | null
  character_group_id: number | null
  user_id: number | null
  category: string | null
  description: string | null
  nonspeaking: boolean
  character?: OnStageCharacter | null
  character_group?: OnStageCharacter | null
  user?: { id: number, first_name: string, last_name: string } | null
}

export interface FrenchSceneDetail extends FrenchScene {
  on_stages: OnStage[]
  entrance_exits: EntranceExit[]
  characters: OnStageCharacter[]
}

export interface EntranceExit {
  id: number
  french_scene_id: number
  character_id: number | null
  stage_exit_id: number | null
  entrance: boolean
  characters: OnStageCharacter[]
}
