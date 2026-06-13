import { useState } from 'react'
import { usePageTitle } from '../../../hooks/usePageTitle'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
} from '@tanstack/react-table'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { theatersQueryOptions, useDeleteTheater } from '../api/theaters'
import type { Theater } from '../types/theater'
import { useIsSuperAdmin, useAdminTheaterIds } from '../../../hooks/useUserRole'
import { Button, Card, ConfirmDialog, PageHeader } from '../../../components/ui'

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
  const [confirmDelete, setConfirmDelete] = useState<Theater | null>(null)

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
              onClick={() => setConfirmDelete(row.original)}
            >
              Delete
            </Button>
          </div>
        ),
      }),
    ] : []),
  ]

  const filteredTheaters = theaters.filter(
    t => !t.fake || adminTheaterIds === null || adminTheaterIds.has(t.id)
  )

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
                    {flexRender(header.column.columnDef.header, header.getContext())}
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTheaters.length === 0 && (
          <p className="px-4 py-6 text-sm text-gray-500 text-center">No theaters found.</p>
        )}
      </Card>

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete "${confirmDelete.name}"? This cannot be undone.`}
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deleteTheater.mutateAsync(confirmDelete.id)
            setConfirmDelete(null)
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
