export interface WordEntry {
  text: string
  value: number
  include: boolean
}

export interface WordLines {
  originalContent: WordEntry[]
  newContent: WordEntry[]
}

export interface WordCloudContextItem {
  type?: 'play' | 'act' | 'scene' | 'french_scene'
  id: number
  label?: string
  name?: string
}
