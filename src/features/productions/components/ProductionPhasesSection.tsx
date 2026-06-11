import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { phasesQueryOptions, useUpsertProductionPhases } from '../../phases/queries'
import type { ProductionPhase } from '../types/production'
import { Button } from '../../../components/ui'

interface Props {
  productionId: number
  productionPhases: ProductionPhase[]
  isAdmin: boolean
}

function formatDate(d: string | null) {
  if (!d) return '—'
  try { return format(parseISO(d), 'MMM d, yyyy') } catch { return d }
}

export function ProductionPhasesSection({ productionId, productionPhases, isAdmin }: Props) {
  const { data: phases } = useSuspenseQuery(phasesQueryOptions())
  const upsert = useUpsertProductionPhases(productionId)
  const [editing, setEditing] = useState(false)

  const phaseMap = new Map(productionPhases.map(pp => [pp.phase_id, pp]))

  const [values, setValues] = useState<Record<number, { start_date: string; end_date: string }>>(() =>
    Object.fromEntries(
      phases.map(p => {
        const pp = phaseMap.get(p.id)
        return [p.id, { start_date: pp?.start_date ?? '', end_date: pp?.end_date ?? '' }]
      })
    )
  )

  if (phases.length === 0) return null

  async function handleSave() {
    const payload = phases
      .filter(p => values[p.id]?.start_date || values[p.id]?.end_date)
      .map(p => ({
        phase_id: p.id,
        start_date: values[p.id]?.start_date || null,
        end_date: values[p.id]?.end_date || null,
      }))
    await upsert.mutateAsync(payload)
    setEditing(false)
  }

  function handleCancel() {
    setValues(
      Object.fromEntries(
        phases.map(p => {
          const pp = phaseMap.get(p.id)
          return [p.id, { start_date: pp?.start_date ?? '', end_date: pp?.end_date ?? '' }]
        })
      )
    )
    setEditing(false)
  }

  const inputClass = 'w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500'

  return (
    <div className="mt-6 border-t border-gray-100 pt-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Production Phases</h3>
        {isAdmin && !editing && (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Edit phases
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 text-xs font-medium text-gray-500 px-1">
            <span>Phase</span><span>Start date</span><span>End date</span>
          </div>
          {phases.map(p => (
            <div key={p.id} className="grid grid-cols-[1fr_1fr_1fr] gap-2 items-center">
              <span className="text-sm text-gray-700">{p.name}</span>
              <input
                type="date"
                className={inputClass}
                value={values[p.id]?.start_date ?? ''}
                onChange={e => setValues(v => ({ ...v, [p.id]: { ...v[p.id], start_date: e.target.value } }))}
              />
              <input
                type="date"
                className={inputClass}
                value={values[p.id]?.end_date ?? ''}
                onChange={e => setValues(v => ({ ...v, [p.id]: { ...v[p.id], end_date: e.target.value } }))}
              />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {phases.map(p => {
            const pp = phaseMap.get(p.id)
            if (!pp && !isAdmin) return null
            return (
              <div key={p.id} className="flex items-baseline gap-2 text-sm">
                <span className="font-medium text-gray-700 w-36 shrink-0">{p.name}</span>
                <span className="text-gray-600">
                  {pp ? `${formatDate(pp.start_date)} – ${formatDate(pp.end_date)}` : (
                    <span className="text-gray-400 italic">not set</span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
