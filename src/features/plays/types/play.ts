export interface PlayListItem {
  id: number
  title: string
  author_id: number
  canonical?: boolean
  author?: { last_name: string }
}

export interface PlayAuthor {
  id: number
  first_name: string
  last_name: string
}

export interface PlayCharacter {
  id: number
  name: string
  age: string | null
  gender: string | null
  description: string | null
  original_line_count: number | null
  new_line_count: number | null
  character_group_id: number | null
  play_id: number
}

export interface PlayCharacterGroup {
  id: number
  name: string
}

// Full character type returned by GET /characters/:id
export interface Character {
  id: number
  name: string
  age: string | null
  gender: string | null
  description: string | null
  play_id: number
}

export interface FrenchSceneSkeleton {
  id: number
  number: string
}

export interface SceneSkeleton {
  id: number
  number: number
  pretty_name: string
  heading: string | null
  summary: string | null
  french_scenes: FrenchSceneSkeleton[]
}

export interface ActSkeleton {
  id: number
  number: number
  summary: string | null
  scenes: SceneSkeleton[]
}

export interface PlaySkeleton {
  id: number
  title: string
  canonical: boolean
  synopsis: string | null
  text_notes: string | null
  production_id: number | null
  author: PlayAuthor
  characters: PlayCharacter[]
  character_groups: PlayCharacterGroup[]
  acts: ActSkeleton[]
}

// Lines returned by the play show action (characters with their lines aggregated)
export interface CharacterBreakdownLine {
  id: number
  number: string
  kind: string | null
  original_content: string
  new_content: string | null
  character_id: number | null
  character_group_id: number | null
  french_scene_id: number
  xml_id: string | null
}

export interface CharacterWithLines {
  id: number
  name: string
  xml_id?: string | null
  age: string | null
  gender: string | null
  description: string | null
  play_id: number
  lines: CharacterBreakdownLine[]
}

export interface CharacterGroupWithLines {
  id: number
  name: string
  xml_id?: string | null
  play_id: number
  lines: CharacterBreakdownLine[]
}

// Returned by GET /api/v1/plays/:id (the full show action)
export interface PlayWithCharacters {
  id: number
  title: string
  canonical: boolean
  author: PlayAuthor
  characters: CharacterWithLines[]
  character_groups: CharacterGroupWithLines[]
  acts: ActSkeleton[]
}

// Selector helpers — derive flat arrays from skeleton
export function getScenes(skeleton: PlaySkeleton): SceneSkeleton[] {
  return skeleton.acts.flatMap(act => act.scenes)
}

export function getFrenchScenes(skeleton: PlaySkeleton): FrenchSceneSkeleton[] {
  return getScenes(skeleton).flatMap(scene => scene.french_scenes)
}

export function getAllCharacters(skeleton: PlaySkeleton) {
  return [
    ...skeleton.characters.map(c => ({ ...c, type: 'character' as const })),
    ...skeleton.character_groups.map(cg => ({
      ...cg,
      type: 'character_group' as const,
    })),
  ].sort((a, b) => a.name.localeCompare(b.name))
}
