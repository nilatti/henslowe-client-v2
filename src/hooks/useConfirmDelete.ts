import { useState } from 'react'
import type { MouseEvent } from 'react'

export function useConfirmDelete<T = boolean>() {
  const [target, setTarget] = useState<T | null>(null)
  const open = (item?: T | MouseEvent<HTMLButtonElement>) => {
    const isEvent = item != null && typeof item === 'object' && 'nativeEvent' in (item as object)
    setTarget(isEvent || item === undefined ? (true as unknown as T) : (item as T))
  }
  return {
    target,
    open,
    close: () => setTarget(null),
  }
}
