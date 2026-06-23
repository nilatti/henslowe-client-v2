import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Card } from './Card'

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
}

export function LinkedItemList({ items, emptyMessage = 'Nothing here yet.' }: LinkedItemListProps) {
  return (
    <Card>
      {items.length === 0 ? (
        <p className="px-4 py-3 text-sm text-gray-500">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map(({ key, to, params, label, sublabel, meta }) => (
            <li key={key}>
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
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
