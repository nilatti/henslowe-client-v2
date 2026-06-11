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
    const aSegs = parseLineNumber(a.number ?? '')
    const bSegs = parseLineNumber(b.number ?? '')
    const len = Math.max(aSegs.length, bSegs.length)
    for (let i = 0; i < len; i++) {
      // Missing trailing segments sort before 0, placing e.g. "4.1.16"
      // before "SD 4.1.16.0" (which is a sub-position of that line).
      const diff = (i < aSegs.length ? aSegs[i] : -1) - (i < bSegs.length ? bSegs[i] : -1)
      if (diff !== 0) return diff
    }
    return 0
  })
}

function parseLineNumber(num: string): number[] {
  const stripped = num.replace(/^(SD|SC)\s*/, '')
  return stripped.split('.').map(n => parseInt(n, 10) || 0)
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

export function isLineCut(line: { new_content: string | null | undefined }): boolean {
  return line.new_content != null && line.new_content.trim() === ''
}

export function isLineEdited(line: { new_content: string | null }): boolean {
  return !!line.new_content && !isLineCut(line)
}
