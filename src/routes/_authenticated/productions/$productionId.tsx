import { useState } from 'react'
import { createFileRoute, Outlet, useNavigate, useRouterState, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { usePageTitle } from '../../../hooks/usePageTitle'
import {
  productionSkeletonQueryOptions,
  useDeleteProduction,
} from '../../../features/productions/api/productions'
import { playsQueryOptions } from '../../../features/plays/api/plays'
import { theatersQueryOptions } from '../../../features/theaters/api/theaters'
import { ProductionForm } from '../../../features/productions/components/ProductionForm'
import {
  useIsSuperAdmin,
  useUserRoleForProduction,
  useUserRoleForTheater,
} from '../../../hooks/useUserRole'
import { Button, Card, ConfirmDialog, PageHeader, Tabs } from '../../../components/ui'

const TABS = [
  { id: 'info', label: 'Info' },
  { id: 'people', label: 'People' },
  { id: 'rehearsals', label: 'Rehearsals' },
  { id: 'doubling-charts', label: 'Doubling Charts' },
  { id: 'set-design', label: 'Set Design' },
  { id: 'script', label: 'Script' },
]

export const Route = createFileRoute('/_authenticated/productions/$productionId')({
  loader: ({ params, context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(productionSkeletonQueryOptions(Number(params.productionId))),
      queryClient.ensureQueryData(playsQueryOptions()),
      queryClient.ensureQueryData(theatersQueryOptions()),
    ]),
  component: function ProductionDetailLayout() {
    const { productionId } = Route.useParams()
    const pid = Number(productionId)
    const { data: production } = useSuspenseQuery(productionSkeletonQueryOptions(pid))
    const deleteProduction = useDeleteProduction()
    const isSuperAdmin = useIsSuperAdmin()
    const productionRole = useUserRoleForProduction(pid, production.theater?.id ?? 0)
    const theaterRole = useUserRoleForTheater(production.theater?.id ?? 0)
    const isAdmin = productionRole === 'admin' || isSuperAdmin
    const canDelete = theaterRole === 'admin' || isSuperAdmin
    const navigate = useNavigate()
    const [isEditing, setIsEditing] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const { location } = useRouterState()

    const title = production.play?.title ?? ''
    const theaterName = production.theater?.name
    usePageTitle(theaterName ? `${title} at ${theaterName}` : title || undefined)

    const path = location.pathname
    let activeTab = 'info'
    if (path.endsWith('/rehearsals')) activeTab = 'rehearsals'
    else if (path.endsWith('/doubling-charts')) activeTab = 'doubling-charts'
    else if (path.endsWith('/set-design')) activeTab = 'set-design'
    else if (path.endsWith('/script')) activeTab = 'script'
    else if (path.endsWith('/people')) activeTab = 'people'

    const handleTabChange = (id: string) => {
      if (id === 'info') navigate({ to: '/productions/$productionId', params: { productionId } })
      else if (id === 'people') navigate({ to: '/productions/$productionId/people', params: { productionId } })
      else if (id === 'rehearsals') navigate({ to: '/productions/$productionId/rehearsals', params: { productionId } })
      else if (id === 'doubling-charts') navigate({ to: '/productions/$productionId/doubling-charts', params: { productionId } })
      else if (id === 'set-design') navigate({ to: '/productions/$productionId/set-design', params: { productionId } })
      else if (id === 'script') navigate({ to: '/productions/$productionId/script', params: { productionId } })
    }

    return (
      <div>
        <div className="mb-2 flex gap-2 text-sm">
          <Link to="/productions" className="text-blue-600 hover:text-blue-800">
            Productions
          </Link>
          <span className="text-gray-400">→</span>
          <span className="text-gray-600">{title}</span>
        </div>

        <PageHeader
          title={title}
          action={
            isAdmin ? (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
                {canDelete && (
                  <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                    Delete
                  </Button>
                )}
              </div>
            ) : undefined
          }
        />

        {isEditing ? (
          <Card className="p-6 mb-6">
            <ProductionForm
              production={production}
              onSuccess={() => setIsEditing(false)}
              onCancel={() => setIsEditing(false)}
            />
          </Card>
        ) : (
          <>
            <Tabs tabs={TABS} activeTab={activeTab} onChange={handleTabChange} />
            <Outlet />
          </>
        )}

        {confirmDelete && (
          <ConfirmDialog
            message={`Delete production of ${title}? This cannot be undone.`}
            isDestructive
            confirmLabel="Delete"
            onConfirm={async () => {
              await deleteProduction.mutateAsync(pid)
              navigate({ to: '/productions' })
            }}
            onCancel={() => setConfirmDelete(false)}
          />
        )}
      </div>
    )
  },
})
