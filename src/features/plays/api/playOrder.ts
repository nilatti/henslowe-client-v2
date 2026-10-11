import type { QueryClient } from '@tanstack/react-query'

// Refetches everything that lists a play's acts, scenes, French scenes or
// script items in play order, after a drag-to-reorder.
export function invalidatePlayOrder(qc: QueryClient, playId: number) {
  qc.invalidateQueries({ queryKey: ['plays', playId] })
  qc.invalidateQueries({ queryKey: ['acts'] })
  qc.invalidateQueries({ queryKey: ['scenes'] })
  qc.invalidateQueries({ queryKey: ['french_scenes'] })
  qc.invalidateQueries({ queryKey: ['rehearsals'] })
}
