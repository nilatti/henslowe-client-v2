// Play order for script items (lines, stage directions, sound cues).
//
// An item's number is only its label ("1.1.23", "SD 1.1.23.1"). Its place in
// the play is: its French scene's place (act → scene → French scene, in the
// order the API returns them), then its position within that French scene.
// position is null until someone reorders that French scene; until then the
// French scene's items keep their number order.

export interface OrderableItem {
  number?: string | null
  line_number?: string | null
  position?: number | null
}

export type WithPlayOrder<T> = T & { _order: number }

function numberSegments(item: OrderableItem): number[] {
  // Sound cues carry their place as line_number rather than number.
  const label = item.number ?? item.line_number ?? ''
  return label
    .replace(/^(SD|SC)\s*/, '')
    .split('.')
    .map(n => parseInt(n, 10) || 0)
}

export function compareByNumber(a: OrderableItem, b: OrderableItem): number {
  const aSegs = numberSegments(a)
  const bSegs = numberSegments(b)
  const len = Math.max(aSegs.length, bSegs.length)
  for (let i = 0; i < len; i++) {
    // Missing trailing segments sort before 0, placing e.g. "4.1.16"
    // before "SD 4.1.16.0" (which is a sub-position of that line).
    const diff = (i < aSegs.length ? aSegs[i] : -1) - (i < bSegs.length ? bSegs[i] : -1)
    if (diff !== 0) return diff
  }
  return 0
}

// Orders the items of a single French scene.
export function orderFrenchSceneItems<T extends OrderableItem>(items: T[]): T[] {
  const positioned = items.length > 0 && items.every(i => i.position != null)
  return [...items].sort(
    positioned ? (a, b) => (a.position as number) - (b.position as number) : compareByNumber
  )
}

interface FrenchSceneItems<L, S, C> {
  lines?: (L | null | undefined)[] | null
  stage_directions?: (S | null | undefined)[] | null
  sound_cues?: (C | null | undefined)[] | null
}

// Merges French scenes' items into one collection per type, stamping each item
// with `_order`, its index in play order across all the given French scenes.
export function mergeInPlayOrder<L extends OrderableItem, S extends OrderableItem, C extends OrderableItem>(
  frenchScenes: FrenchSceneItems<L, S, C>[]
): { lines: WithPlayOrder<L>[]; stage_directions: WithPlayOrder<S>[]; sound_cues: WithPlayOrder<C>[] } {
  const merged = {
    lines: [] as WithPlayOrder<L>[],
    stage_directions: [] as WithPlayOrder<S>[],
    sound_cues: [] as WithPlayOrder<C>[],
  }
  let order = 0
  for (const fs of frenchScenes) {
    const tagged = [
      ...(fs.lines ?? []).filter(Boolean).map(item => ({ kind: 'lines' as const, item: item as L })),
      ...(fs.stage_directions ?? []).filter(Boolean).map(item => ({ kind: 'stage_directions' as const, item: item as S })),
      ...(fs.sound_cues ?? []).filter(Boolean).map(item => ({ kind: 'sound_cues' as const, item: item as C })),
    ]
    const ordered = orderFrenchSceneItems(
      tagged.map(t => ({ ...t, number: t.item.number, line_number: t.item.line_number, position: t.item.position }))
    )
    for (const { kind, item } of ordered) {
      ;(merged[kind] as unknown[]).push({ ...item, _order: order++ })
    }
  }
  return merged
}

// Sorts items by `_order` when every item has one (they came from
// mergeInPlayOrder); otherwise falls back to the given number-based sort.
export function sortByPlayOrder<T>(items: T[], fallback: (items: T[]) => T[]): T[] {
  const hasOrder = (i: T) => typeof (i as { _order?: unknown })._order === 'number'
  if (items.length === 0 || !items.every(hasOrder)) return fallback(items)
  return [...items].sort(
    (a, b) => (a as unknown as { _order: number })._order - (b as unknown as { _order: number })._order
  )
}
