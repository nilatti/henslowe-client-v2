import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Card } from './Card'
import { SortableList } from './SortableList'

interface LinkedItem {
  key: string | number
  to: string
  params?: Record<string, string>
  label: ReactNode
  sublabel?: ReactNode
  meta?: ReactNode
}

interface LinkedItemListProps {
  items: LinkedItem[]
  emptyMessage?: string
  // Drag-to-reorder: shows a handle on each row and reports moves by index.
  onMove?: (fromIndex: number, toIndex: number) => void
  handleLabel?: string
}

export function LinkedItemList({
  items,
  emptyMessage = 'Nothing here yet.',
  onMove,
  handleLabel,
}: LinkedItemListProps) {
  return (
    <Card>
      {items.length === 0 ? (
        <p className="px-4 py-3 text-sm text-gray-500">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          <SortableList
            items={items}
            getId={item => item.key}
            enabled={!!onMove}
            onMove={onMove ?? (() => {})}
            as="li"
            rowClassName={onMove ? 'bg-white pl-2' : ''}
            handleLabel={handleLabel}
            renderItem={({ to, params, label, sublabel, meta }) => (
              <Link
                to={to as never}
                params={(params ?? {}) as never}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-sm"
              >
                <div>
                  <span className="text-gray-900">{label}</span>
                  {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
                </div>
                {meta !== undefined && (
                  <span className="text-gray-400 text-xs shrink-0 ml-4">{meta}</span>
                )}
              </Link>
            )}
          />
        </ul>
      )}
    </Card>
  )
}
