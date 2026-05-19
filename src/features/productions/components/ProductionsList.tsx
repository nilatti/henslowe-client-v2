import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { productionsQueryOptions } from '../api/productions'
import { ProductionForm } from './ProductionForm'
import { useIsSuperAdmin } from '../../../hooks/useUserRole'
import { Button, Card, PageHeader } from '../../../components/ui'

export function ProductionsList() {
  const { data: productions } = useSuspenseQuery(productionsQueryOptions())
  const isSuperAdmin = useIsSuperAdmin()
  const navigate = useNavigate()

  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      <PageHeader
        title="Productions"
        action={
          isSuperAdmin && !showForm ? (
            <Button onClick={() => setShowForm(true)}>+ New Production</Button>
          ) : undefined
        }
      />

      {showForm && (
        <Card className="p-6 mb-6">
          <ProductionForm
            onSuccess={id => {
              setShowForm(false)
              if (id) navigate({ to: '/productions/$productionId', params: { productionId: String(id) } })
            }}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      <Card>
        {productions.length === 0 ? (
          <p className="px-4 py-3 text-sm text-gray-500">No productions yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {productions.map(p => (
              <li key={p.id}>
                <Link
                  to="/productions/$productionId"
                  params={{ productionId: String(p.id) }}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-sm"
                >
                  <div>
                    <span className="font-medium text-gray-900">{p.play.title}</span>
                    <span className="text-gray-500 ml-2">· {p.theater.name}</span>
                  </div>
                  <span className="text-gray-400 text-xs">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
