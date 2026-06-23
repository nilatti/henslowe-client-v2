import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { useSuspenseQuery } from '@tanstack/react-query'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { Link, useNavigate } from '@tanstack/react-router'
import { productionsQueryOptions } from '../api/productions'
import type { ProductionListItem } from '../types/production'
import { ProductionForm } from './ProductionForm'
import { useIsAnyAdmin } from '../../../hooks/useUserRole'
import { Button, Card, PageHeader, SortableTable } from '../../../components/ui'

const columnHelper = createColumnHelper<ProductionListItem>()

const columns = [
  columnHelper.accessor(row => row.play.title, {
    id: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <Link
        to="/productions/$productionId"
        params={{ productionId: String(row.original.id) }}
        className="text-blue-600 hover:text-blue-800"
      >
        {row.original.play.title}
      </Link>
    ),
  }),
  columnHelper.accessor(row => row.theater.name, {
    id: 'theater',
    header: 'Theater',
    cell: ({ row }) => row.original.theater.name,
  }),
  columnHelper.accessor('end_date', {
    header: 'Year',
    cell: info => info.getValue()?.slice(0, 4) ?? '—',
  }),
]

export function ProductionsList() {
  usePageTitle('Productions')
  const { data: productions } = useSuspenseQuery(productionsQueryOptions())
  const isAdmin = useIsAnyAdmin()
  const navigate = useNavigate()

  const [showForm, setShowForm] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'title', desc: false },
  ])
  const [search, setSearch] = useState('')

  const filteredProductions = useMemo(() => {
    if (!search) return productions
    const q = search.toLowerCase()
    return productions.filter(p =>
      p.play.title.toLowerCase().includes(q) ||
      p.theater.name.toLowerCase().includes(q)
    )
  }, [productions, search])

  const table = useReactTable({
    data: filteredProductions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div>
      <PageHeader
        title="Productions"
        action={
          isAdmin && !showForm ? (
            <Button onClick={() => setShowForm(true)}>New Production</Button>
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

      <SortableTable
        table={table}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by title or theater…"
        emptyMessage={search ? 'No productions match your search.' : 'No productions yet.'}
      />
    </div>
  )
}
