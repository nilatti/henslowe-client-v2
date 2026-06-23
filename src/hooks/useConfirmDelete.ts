import { useState } from 'react'

export function useConfirmDelete<T = boolean>() {
  const [target, setTarget] = useState<T | null>(null)
  return {
    target,
    open: (item?: T) => setTarget(item !== undefined ? item : (true as unknown as T)),
    close: () => setTarget(null),
  }
}
