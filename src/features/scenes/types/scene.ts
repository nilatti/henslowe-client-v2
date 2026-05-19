export interface Scene {
  id: number
  number: number
  act_id: number
  summary: string | null
  heading: string | null
  start_page: number | null
  end_page: number | null
  original_line_count: number | null
  new_line_count: number | null
  pretty_name: string
  created_at: string
  updated_at: string
}

export interface FrenchSceneInScene {
  id: number
  number: string  // alphabetic: "a", "b", "c"
  scene_id: number
  pretty_name?: string
  on_stages: SceneOnStage[]
  entrance_exits: SceneEntranceExit[]
}

export interface SceneOnStage {
  id: number
  character_id: number | null
  character_group_id: number | null
  nonspeaking: boolean
}

export interface SceneEntranceExit {
  id: number
  entrance: boolean
  character_id: number | null
  character_group_id: number | null
  stage_exit_id: number | null
}

export interface SceneWithFrenchScenes extends Scene {
  french_scenes: FrenchSceneInScene[]
}
