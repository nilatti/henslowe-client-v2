import * as DiffLib from 'diff'
import {
  compareByNumber,
  mergeInPlayOrder,
  sortByPlayOrder,
  type OrderableItem,
} from '../../../utils/scriptOrder'
import type {
  ScriptFrenchScene,
  ScriptAct,
  MergedText,
  PlayScript,
} from '../types/script'

// Items come back stamped with `_order` (their play order), which
// sortScriptItems follows.
export function mergeTextFromFrenchScenes(
  frenchScenes: ScriptFrenchScene[]
): MergedText {
  return mergeInPlayOrder(frenchScenes)
}

export function getFrenchScenesFromAct(act: ScriptAct): ScriptFrenchScene[] {
  return act.scenes.flatMap(s => s.french_scenes)
}

export function getFrenchScenesFromPlay(play: PlayScript): ScriptFrenchScene[] {
  return play.acts.flatMap(act => act.scenes.flatMap(s => s.french_scenes))
}

// Play order when the items came from mergeTextFromFrenchScenes, else number order.
export function sortScriptItems<T extends OrderableItem>(items: T[]): T[] {
  return sortByPlayOrder(items, all => [...all].sort(compareByNumber))
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
