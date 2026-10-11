// Returns `items` rearranged to follow `ids`; items not listed keep their
// relative order at the end.
export function reorderByIds<T extends { id: number }>(items: T[], ids: number[]): T[] {
  const rank = new Map(ids.map((id, i) => [id, i]))
  return [...items].sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity))
}
