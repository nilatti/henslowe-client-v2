import { arrayMove } from '@dnd-kit/sortable'
import { orderFrenchSceneItems } from '../../../utils/scriptOrder'
import type { PlayScript, ScriptFrenchScene } from '../types/script'

export type ScriptItemType = 'line' | 'stage_direction' | 'sound_cue'

// A row in the draggable script: an item, or a French scene heading that marks
// where one French scene ends and the next begins.
export type ScriptRow =
  | { kind: 'item'; key: string; type: ScriptItemType; id: number; frenchSceneId: number }
  | { kind: 'header'; key: string; frenchSceneId: number }

// The payload for PUT /plays/:id/reorder_script_items.
export interface FrenchSceneOrder {
  id: number
  items: { type: ScriptItemType; id: number }[]
}

export const itemKey = (type: ScriptItemType, id: number) => `${type}-${id}`
export const headerKey = (frenchSceneId: number) => `fs-${frenchSceneId}`

const FIELDS = { line: 'lines', stage_direction: 'stage_directions', sound_cue: 'sound_cues' } as const

// Every item of a French scene, in its current order, including ones the
// script view doesn't show (e.g. empty text).
function allItemKeys(fs: ScriptFrenchScene): string[] {
  const tagged = (Object.keys(FIELDS) as ScriptItemType[]).flatMap(type =>
    (fs[FIELDS[type]] as { id: number; number?: string | null; line_number?: string | null; position?: number | null }[])
      .map(item => ({ ...item, key: itemKey(type, item.id) }))
  )
  return orderFrenchSceneItems(tagged).map(i => i.key)
}

function parseKey(key: string): { type: ScriptItemType; id: number } {
  const i = key.lastIndexOf('-')
  return { type: key.slice(0, i) as ScriptItemType, id: Number(key.slice(i + 1)) }
}

// Works out the new order after dragging rows[fromIndex] to toIndex. An item
// joins the French scene of the nearest heading above it (or the first French
// scene if there's none). Returns the complete new item list for the French
// scene it left and the one it joined, or null if nothing changed. Items not
// shown as rows stay in their French scene, after the shown ones.
export function buildScriptReorder(
  frenchScenes: ScriptFrenchScene[],
  rows: ScriptRow[],
  fromIndex: number,
  toIndex: number,
): FrenchSceneOrder[] | null {
  const moved = rows[fromIndex]
  if (!moved || moved.kind !== 'item' || fromIndex === toIndex || frenchScenes.length === 0) return null

  const shownByFs = new Map<number, string[]>()
  let currentFs = frenchScenes[0].id
  let destination = currentFs
  for (const row of arrayMove(rows, fromIndex, toIndex)) {
    if (row.kind === 'header') {
      currentFs = row.frenchSceneId
      continue
    }
    shownByFs.set(currentFs, [...(shownByFs.get(currentFs) ?? []), row.key])
    if (row.key === moved.key) destination = currentFs
  }

  const shownKeys = new Set(rows.filter(r => r.kind === 'item').map(r => r.key))
  const affected = [...new Set([moved.frenchSceneId, destination])]
  const orders = affected.map(fsId => {
    const fs = frenchScenes.find(f => f.id === fsId)
    const hidden = fs ? allItemKeys(fs).filter(k => !shownKeys.has(k)) : []
    return { id: fsId, items: [...(shownByFs.get(fsId) ?? []), ...hidden].map(parseKey) }
  })

  if (affected.length === 1) {
    const fs = frenchScenes.find(f => f.id === affected[0])
    const before = fs ? allItemKeys(fs) : []
    const after = orders[0].items.map(i => itemKey(i.type, i.id))
    if (before.join() === after.join()) return null
  }
  return orders
}

// Applies orders to the cached play script: each listed French scene gets
// exactly its listed items, positioned 1..n.
export function applyScriptReorder(script: PlayScript, orders: FrenchSceneOrder[]): PlayScript {
  const byFs = new Map(orders.map(o => [o.id, o.items]))
  const itemsByKey = new Map<string, object>()
  script.acts.forEach(act =>
    act.scenes.forEach(scene =>
      scene.french_scenes.forEach(fs => {
        if (!byFs.has(fs.id)) return
        ;(Object.keys(FIELDS) as ScriptItemType[]).forEach(type =>
          (fs[FIELDS[type]] as { id: number }[]).forEach(item => itemsByKey.set(itemKey(type, item.id), item))
        )
      })
    )
  )

  return {
    ...script,
    acts: script.acts.map(act => ({
      ...act,
      scenes: act.scenes.map(scene => ({
        ...scene,
        french_scenes: scene.french_scenes.map(fs => {
          const items = byFs.get(fs.id)
          if (!items) return fs
          const next = { ...fs, lines: [], stage_directions: [], sound_cues: [] } as ScriptFrenchScene
          items.forEach(({ type, id }, index) => {
            const item = itemsByKey.get(itemKey(type, id))
            if (!item) return
            ;(next[FIELDS[type]] as object[]).push({ ...item, french_scene_id: fs.id, position: index + 1 })
          })
          return next
        }),
      })),
    })),
  }
}

const normalizeNumber = (value: string) => value.replace(/\s+/g, '').toUpperCase()

// Finds the line, stage direction or sound cue whose number matches `input`
// (ignoring spaces and case, so "sd 1.1.4.1" finds "SD 1.1.4.1").
export function findItemByNumber(
  frenchScenes: ScriptFrenchScene[],
  input: string,
): { type: ScriptItemType; id: number } | null {
  const wanted = normalizeNumber(input)
  if (!wanted) return null
  for (const fs of frenchScenes) {
    for (const type of Object.keys(FIELDS) as ScriptItemType[]) {
      const match = (fs[FIELDS[type]] as { id: number; number?: string | null }[]).find(
        item => item.number && normalizeNumber(item.number) === wanted,
      )
      if (match) return { type, id: match.id }
    }
  }
  return null
}

// Works out the new order after moving one item just after (or before) another
// anywhere in the play. Returns the complete new item list for the French scene
// it left and the one it joined, or null if nothing changed.
export function buildScriptMove(
  frenchScenes: ScriptFrenchScene[],
  moved: { type: ScriptItemType; id: number },
  target: { type: ScriptItemType; id: number },
  placement: 'after' | 'before',
): FrenchSceneOrder[] | null {
  const movedKey = itemKey(moved.type, moved.id)
  const targetKey = itemKey(target.type, target.id)
  if (movedKey === targetKey) return null

  const keysByFs = new Map(frenchScenes.map(fs => [fs.id, allItemKeys(fs)]))
  const sourceFs = frenchScenes.find(fs => keysByFs.get(fs.id)!.includes(movedKey))
  const destinationFs = frenchScenes.find(fs => keysByFs.get(fs.id)!.includes(targetKey))
  if (!sourceFs || !destinationFs) return null

  const before = keysByFs.get(sourceFs.id)!
  const source = before.filter(k => k !== movedKey)
  const destination = sourceFs.id === destinationFs.id ? source : [...keysByFs.get(destinationFs.id)!]
  const targetIndex = destination.indexOf(targetKey)
  destination.splice(placement === 'after' ? targetIndex + 1 : targetIndex, 0, movedKey)

  if (sourceFs.id === destinationFs.id) {
    if (destination.join() === before.join()) return null
    return [{ id: sourceFs.id, items: destination.map(parseKey) }]
  }
  return [
    { id: sourceFs.id, items: source.map(parseKey) },
    { id: destinationFs.id, items: destination.map(parseKey) },
  ]
}
