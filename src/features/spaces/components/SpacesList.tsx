import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { spacesQueryOptions, useDeleteSpace } from '../api/spaces'
import type { Space } from '../types/space'
import { SpaceForm } from './SpaceForm'
import { useIsSuperAdmin } from '../../../hooks/useUserRole'
import { Button, Card, ConfirmDialog, PageHeader, SortableTable } from '../../../components/ui'

export function SpacesList() {
  const { data: spaces } = useSuspenseQuery(spacesQueryOptions())
  const deleteSpace = useDeleteSpace()
  const isSuperAdmin = useIsSuperAdmin()

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ])
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Space | null>(null)
  const [search, setSearch] = useState('')

  const filteredSpaces = useMemo(() => {
    if (!search) return spaces
    const q = search.toLowerCase()
    return spaces.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q) ||
      s.state?.toLowerCase().includes(q)
    )
  }, [spaces, search])

  const columnHelper = createColumnHelper<Space>()
  const columns = [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: ({ row }) => (
        <Link
          to={'/spaces/$spaceId' as never}
          params={{ spaceId: String(row.original.id) } as never}
          className="text-blue-600 hover:text-blue-800"
        >
          {row.original.name}
        </Link>
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
    columnHelper.accessor('seating_capacity', {
      header: 'Seats',
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
              onClick={() => setConfirmDelete(row.original)}
            >
              Delete
            </Button>
          </div>
        ),
      }),
    ] : []),
  ]

  const table = useReactTable({
    data: filteredSpaces,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div>
      <PageHeader
        title="Spaces"
        action={
          !showForm ? (
            <Button onClick={() => setShowForm(true)}>New Space</Button>
          ) : undefined
        }
      />

      {showForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            New Space
          </h2>
          <SpaceForm
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      <SortableTable
        table={table}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search spaces…"
        emptyMessage={search ? 'No spaces match your search.' : 'No spaces found.'}
      />

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete "${confirmDelete.name}"? This cannot be undone.`}
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deleteSpace.mutateAsync(confirmDelete.id)
            setConfirmDelete(null)
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
