import type { ReactNode } from 'react'
import { Card } from './Card'

interface InfoField {
  label: string
  value: ReactNode
  valueClassName?: string
}

interface InfoCardProps {
  fields: (InfoField | null | false | undefined | '' | 0)[]
  emptyMessage?: string
  children?: ReactNode
}

export function InfoCard({ fields, emptyMessage, children }: InfoCardProps) {
  const visible = fields.filter((f): f is InfoField => !!f && typeof f === 'object')

  if (visible.length === 0 && !emptyMessage && !children) return null

  return (
    <Card className="p-6">
      {visible.length > 0 ? (
        <dl className="space-y-3 text-sm">
          {visible.map(({ label, value, valueClassName }) => (
            <div key={label}>
              <dt className="font-medium text-gray-700">{label}</dt>
              <dd className={`mt-1 text-gray-600${valueClassName ? ` ${valueClassName}` : ''}`}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        emptyMessage && (
          <p className="text-sm text-gray-400 italic">{emptyMessage}</p>
        )
      )}
      {children}
    </Card>
  )
}
