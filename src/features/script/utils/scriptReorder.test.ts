import { describe, it, expect } from 'vitest'
import {
  applyScriptReorder,
  buildScriptMove,
  buildScriptReorder,
  findItemByNumber,
  headerKey,
  itemKey,
  type ScriptRow,
} from './scriptReorder'
import type { PlayScript, ScriptFrenchScene } from '../types/script'

const line = (id: number, number: string, fsId: number, original_content = 'text') => ({
  id, number, kind: 'line', original_content, new_content: null, character_id: null,
  character_group_id: null, french_scene_id: fsId, xml_id: null, position: null,
})
const direction = (id: number, number: string, fsId: number) => ({
  id, number, kind: 'entrance', original_content: 'Enter', new_content: null,
  french_scene_id: fsId, xml_id: null, position: null,
})

function frenchScene(id: number, lines: ReturnType<typeof line>[], stage_directions: ReturnType<typeof direction>[] = []): ScriptFrenchScene {
  return { id, number: 'a', pretty_name: `fs${id}`, lines, stage_directions, sound_cues: [] }
}

// fs 1: line 1, SD 2, line 3 · fs 2: line 4, line 5 (and an empty line 6 the viewer hides)
const fs1 = frenchScene(1, [line(1, '1.1.1', 1), line(3, '1.1.2', 1)], [direction(2, 'SD 1.1.1.1', 1)])
const fs2 = frenchScene(2, [line(4, '1.1.3', 2), line(5, '1.1.4', 2), line(6, '1.1.5', 2, '')])
const frenchScenes = [fs1, fs2]

const item = (type: 'line' | 'stage_direction', id: number, fsId: number): ScriptRow =>
  ({ kind: 'item', key: itemKey(type, id), type, id, frenchSceneId: fsId })
const header = (fsId: number): ScriptRow => ({ kind: 'header', key: headerKey(fsId), frenchSceneId: fsId })

const rows: ScriptRow[] = [
  header(1), item('line', 1, 1), item('stage_direction', 2, 1), item('line', 3, 1),
  header(2), item('line', 4, 2), item('line', 5, 2),
]

describe('buildScriptReorder', () => {
  it('reorders within a French scene', () => {
    expect(buildScriptReorder(frenchScenes, rows, 3, 1)).toEqual([
      { id: 1, items: [{ type: 'line', id: 3 }, { type: 'line', id: 1 }, { type: 'stage_direction', id: 2 }] },
    ])
  })

  it('moves an item into the next French scene when dropped below its heading', () => {
    // Line 1 dropped just after the fs 2 heading.
    expect(buildScriptReorder(frenchScenes, rows, 1, 4)).toEqual([
      { id: 1, items: [{ type: 'stage_direction', id: 2 }, { type: 'line', id: 3 }] },
      { id: 2, items: [{ type: 'line', id: 1 }, { type: 'line', id: 4 }, { type: 'line', id: 5 }, { type: 'line', id: 6 }] },
    ])
  })

  it('keeps an item in the earlier French scene when dropped above the next heading', () => {
    // Line 5 dropped where line 3 is: last item of fs 1.
    const orders = buildScriptReorder(frenchScenes, rows, 6, 3)
    expect(orders?.find(o => o.id === 1)?.items.map(i => i.id)).toEqual([1, 2, 5, 3])
    expect(orders?.find(o => o.id === 2)?.items.map(i => i.id)).toEqual([4, 6])
  })

  it('ends the earlier French scene when dropped onto the next heading from below', () => {
    // Line 5 dropped on the fs 2 heading while dragging up.
    const orders = buildScriptReorder(frenchScenes, rows, 6, 4)
    expect(orders?.find(o => o.id === 1)?.items.map(i => i.id)).toEqual([1, 2, 3, 5])
    expect(orders?.find(o => o.id === 2)?.items.map(i => i.id)).toEqual([4, 6])
  })

  it('keeps hidden items in their French scene', () => {
    const orders = buildScriptReorder(frenchScenes, rows, 5, 6)
    expect(orders).toEqual([{ id: 2, items: [{ type: 'line', id: 5 }, { type: 'line', id: 4 }, { type: 'line', id: 6 }] }])
  })

  it('treats items above every heading as part of the first French scene', () => {
    const noHeaders = rows.filter(r => r.kind === 'item')
    const orders = buildScriptReorder([fs1], noHeaders.slice(0, 3), 2, 0)
    expect(orders).toEqual([{ id: 1, items: [{ type: 'line', id: 3 }, { type: 'line', id: 1 }, { type: 'stage_direction', id: 2 }] }])
  })

  it('ignores dragging a heading and drops that change nothing', () => {
    expect(buildScriptReorder(frenchScenes, rows, 0, 2)).toBeNull()
    expect(buildScriptReorder(frenchScenes, rows, 2, 2)).toBeNull()
  })
})

describe('applyScriptReorder', () => {
  const script = {
    id: 1, title: 'Play', canonical: false, production_id: 1, characters: [], character_groups: [],
    acts: [{ id: 1, number: 1, scenes: [{ id: 1, number: 1, pretty_name: '1.1', french_scenes: frenchScenes }] }],
  } as PlayScript

  it('moves items between French scenes and sets their positions', () => {
    const orders = buildScriptReorder(frenchScenes, rows, 1, 4)!
    const [a, b] = applyScriptReorder(script, orders).acts[0].scenes[0].french_scenes
    expect(a.lines.map(l => [l.id, l.position])).toEqual([[3, 2]])
    expect(a.stage_directions.map(sd => [sd.id, sd.position])).toEqual([[2, 1]])
    expect(b.lines.map(l => [l.id, l.position, l.french_scene_id])).toEqual([[1, 1, 2], [4, 2, 2], [5, 3, 2], [6, 4, 2]])
  })
})

describe('findItemByNumber', () => {
  it('finds lines and stage directions, ignoring spaces and case', () => {
    expect(findItemByNumber(frenchScenes, ' 1.1.3 ')).toEqual({ type: 'line', id: 4 })
    expect(findItemByNumber(frenchScenes, 'sd1.1.1.1')).toEqual({ type: 'stage_direction', id: 2 })
  })

  it('returns null for unknown or blank numbers', () => {
    expect(findItemByNumber(frenchScenes, '9.9.9')).toBeNull()
    expect(findItemByNumber(frenchScenes, '  ')).toBeNull()
  })
})

describe('buildScriptMove', () => {
  const ids = (orders: ReturnType<typeof buildScriptMove>, fsId: number) =>
    orders?.find(o => o.id === fsId)?.items.map(i => i.id)

  it('moves an item after another in a different French scene', () => {
    const orders = buildScriptMove(frenchScenes, { type: 'line', id: 1 }, { type: 'line', id: 4 }, 'after')
    expect(ids(orders, 1)).toEqual([2, 3])
    expect(ids(orders, 2)).toEqual([4, 1, 5, 6])
  })

  it('moves an item before another, e.g. to the top of a French scene', () => {
    const orders = buildScriptMove(frenchScenes, { type: 'line', id: 5 }, { type: 'line', id: 1 }, 'before')
    expect(ids(orders, 1)).toEqual([5, 1, 2, 3])
    expect(ids(orders, 2)).toEqual([4, 6])
  })

  it('reorders within one French scene', () => {
    expect(buildScriptMove(frenchScenes, { type: 'line', id: 1 }, { type: 'line', id: 3 }, 'after')).toEqual([
      { id: 1, items: [{ type: 'stage_direction', id: 2 }, { type: 'line', id: 3 }, { type: 'line', id: 1 }] },
    ])
  })

  it('returns null when nothing changes', () => {
    expect(buildScriptMove(frenchScenes, { type: 'line', id: 1 }, { type: 'stage_direction', id: 2 }, 'before')).toBeNull()
    expect(buildScriptMove(frenchScenes, { type: 'line', id: 1 }, { type: 'line', id: 1 }, 'after')).toBeNull()
  })
})
