import { useState, useMemo } from 'react'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { useConfirmDelete } from '../../../hooks/useConfirmDelete'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { theatersQueryOptions, useDeleteTheater } from '../api/theaters'
import type { Theater } from '../types/theater'
import { useIsSuperAdmin, useAdminTheaterIds } from '../../../hooks/useUserRole'
import { Button, ConfirmDialog, PageHeader, SortableTable } from '../../../components/ui'

export function TheatersList() {
  usePageTitle('Theaters')
  const { data: theaters } = useSuspenseQuery(theatersQueryOptions())
  const deleteTheater = useDeleteTheater()
  const navigate = useNavigate()
  const isSuperAdmin = useIsSuperAdmin()
  const adminTheaterIds = useAdminTheaterIds()

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ])
  const { target: confirmDelete, open: requestDelete, close: clearDelete } = useConfirmDelete<Theater>()
  const [search, setSearch] = useState('')

  const columnHelper = createColumnHelper<Theater>()
  const columns = [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: ({ row }) => (
        <a
          href={`/theaters/${row.original.id}`}
          onClick={(e) => {
            e.preventDefault()
            void navigate({ to: '/theaters/$theaterId' as never, params: { theaterId: String(row.original.id) } as never })
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          {row.original.name}
        </a>
      ),
    }),
    columnHelper.accessor('city', {
      header: 'City',
      cell: info => info.getValue() ?? '—',
    }),
    columnHelper.accessor('state', {
      header: 'State',
      cell: info => info.getValue() ?? '—',
    }),
    ...(isSuperAdmin ? [
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex gap-2 justify-end">
            <Button
              variant="danger"
              onClick={() => requestDelete(row.original)}
            >
              Delete
            </Button>
          </div>
        ),
      }),
    ] : []),
  ]

  const filteredTheaters = useMemo(() => {
    const visible = theaters.filter(
      t => !t.fake || adminTheaterIds === null || adminTheaterIds.has(t.id)
    )
    if (!search) return visible
    const q = search.toLowerCase()
    return visible.filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.city?.toLowerCase().includes(q) ||
      t.state?.toLowerCase().includes(q)
    )
  }, [theaters, adminTheaterIds, search])

  const table = useReactTable({
    data: filteredTheaters,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div>
      <PageHeader
        title="Theaters"
        action={
          isSuperAdmin ? (
            <Link to={'/theaters/new' as never}>
              <Button>New Theater</Button>
            </Link>
          ) : undefined
        }
      />

      <SortableTable
        table={table}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search theaters…"
        emptyMessage={search ? 'No theaters match your search.' : 'No theaters found.'}
      />

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete "${confirmDelete.name}"? This cannot be undone.`}
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deleteTheater.mutateAsync(confirmDelete.id)
            clearDelete()
          }}
          onCancel={clearDelete}
        />
      )}
    </div>
  )
}
