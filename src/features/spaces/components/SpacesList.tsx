import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
} from '@tanstack/react-table'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { spacesQueryOptions, useDeleteSpace } from '../api/spaces'
import type { Space } from '../types/space'
import { SpaceForm } from './SpaceForm'
import { useIsSuperAdmin } from '../../../hooks/useUserRole'
import { Button, Card, ConfirmDialog, PageHeader } from '../../../components/ui'

export function SpacesList() {
  const { data: spaces } = useSuspenseQuery(spacesQueryOptions())
  const deleteSpace = useDeleteSpace()
  const isSuperAdmin = useIsSuperAdmin()

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ])
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Space | null>(null)

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
    data: spaces,
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

      <Card>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted() === 'asc'
                      ? ' ↑'
                      : header.column.getIsSorted() === 'desc'
                      ? ' ↓'
                      : ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-3 text-gray-700">
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {spaces.length === 0 && (
          <p className="px-4 py-6 text-sm text-gray-500 text-center">
            No spaces found.
          </p>
        )}
      </Card>

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
