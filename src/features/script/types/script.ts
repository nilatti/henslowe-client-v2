export interface ScriptLine {
  id: number
  number: string
  kind: string | null
  original_content: string
  new_content: string | null
  character_id: number | null
  character_group_id: number | null
  french_scene_id: number
  xml_id: string | null
  character?: { id: number; name: string } | null
  character_group?: { id: number; name: string } | null
}

export interface ScriptStageDirection {
  id: number
  number: string
  kind: string | null
  original_content: string
  new_content: string | null
  french_scene_id: number
  xml_id: string | null
}

export interface ScriptSoundCue {
  id: number
  xml_id: string | null
  number: string | null
  kind: string | null
  original_content: string | null
  new_content: string | null
  french_scene_id: number
  notes: string | null
}

export type ScriptItem = (ScriptLine | ScriptStageDirection | ScriptSoundCue) & {
  _type: 'line' | 'stage_direction' | 'sound_cue'
}

export interface ScriptFrenchScene {
  id: number
  number: string
  pretty_name: string
  lines: ScriptLine[]
  stage_directions: ScriptStageDirection[]
  sound_cues: ScriptSoundCue[]
}

export interface ScriptScene {
  id: number
  number: number
  pretty_name: string
  french_scenes: ScriptFrenchScene[]
}

export interface ScriptAct {
  id: number
  number: number
  scenes: ScriptScene[]
}

export interface PlayScript {
  id: number
  title: string
  canonical: boolean
  production_id: number | null
  production?: { lines_per_minute: number | null } | null
  characters: { id: number; name: string }[]
  character_groups: { id: number; name: string }[]
  acts: ScriptAct[]
}

export interface MergedText {
  lines: ScriptLine[]
  stage_directions: ScriptStageDirection[]
  sound_cues: ScriptSoundCue[]
}
