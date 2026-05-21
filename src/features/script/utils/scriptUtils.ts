import * as DiffLib from 'diff'
import type {
  ScriptFrenchScene,
  ScriptAct,
  MergedText,
  PlayScript,
} from '../types/script'

export function mergeTextFromFrenchScenes(
  frenchScenes: ScriptFrenchScene[]
): MergedText {
  return {
    lines: frenchScenes.flatMap(fs => fs.lines),
    stage_directions: frenchScenes.flatMap(fs => fs.stage_directions),
    sound_cues: frenchScenes.flatMap(fs => fs.sound_cues),
  }
}

export function getFrenchScenesFromAct(act: ScriptAct): ScriptFrenchScene[] {
  return act.scenes.flatMap(s => s.french_scenes)
}

export function getFrenchScenesFromPlay(play: PlayScript): ScriptFrenchScene[] {
  return play.acts.flatMap(act => act.scenes.flatMap(s => s.french_scenes))
}

export function sortScriptItems<
  T extends { number: string | null | undefined },
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aNum = parseLineNumber(a.number ?? '')
    const bNum = parseLineNumber(b.number ?? '')
    return aNum - bNum
  })
}

function parseLineNumber(num: string): number {
  // Strip SD/SC prefix, then parse the dotted number (e.g. "1.2.3" -> 1.2)
  const stripped = num.replace(/^(SD|SC)\s*/, '')
  return parseFloat(stripped) || 0
}

export function buildDiff(
  original: string,
  newContent: string
): { type: 'added' | 'removed' | 'unchanged'; value: string }[] {
  return DiffLib.diffWordsWithSpace(original, newContent).map(part => ({
    type: part.added ? 'added' : part.removed ? 'removed' : 'unchanged',
    value: part.value,
  }))
}

export function isLineCut(line: { new_content: string | null }): boolean {
  return !!line.new_content && line.new_content.trim() === ''
}

export function isLineEdited(line: { new_content: string | null }): boolean {
  return !!line.new_content && !isLineCut(line)
}
