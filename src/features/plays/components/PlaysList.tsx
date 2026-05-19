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
import { Link, useNavigate } from '@tanstack/react-router'
import { playsQueryOptions, useDeletePlay } from '../api/plays'
import { type PlayListItem } from '../types/play'
import { PlayForm } from './PlayForm'
import { useIsSuperAdmin } from '../../../hooks/useUserRole'
import { Button, Card, ConfirmDialog, PageHeader } from '../../../components/ui'

export function PlaysList() {
  const { data: plays } = useSuspenseQuery(playsQueryOptions())
  const deletePlay = useDeletePlay()
  const isSuperAdmin = useIsSuperAdmin()
  const navigate = useNavigate()

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'title', desc: false },
  ])
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<PlayListItem | null>(null)

  const columnHelper = createColumnHelper<PlayListItem>()
  const columns = [
    columnHelper.accessor('title', {
      header: 'Title',
      cell: ({ row }) => (
        <Link
          to="/plays/$playId"
          params={{ playId: String(row.original.id) }}
          className="text-blue-600 hover:text-blue-800"
        >
          {row.original.title}
        </Link>
      ),
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
    data: plays,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div>
      <PageHeader
        title="Plays"
        action={
          isSuperAdmin && !showForm ? (
            <Button onClick={() => setShowForm(true)}>New Play</Button>
          ) : undefined
        }
      />

      {showForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">New Play</h2>
          <PlayForm
            onSuccess={id => {
              setShowForm(false)
              if (id) navigate({ to: '/plays/$playId', params: { playId: String(id) } })
            }}
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
      </Card>

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete "${confirmDelete.title}"? This will delete all acts, scenes, characters and lines.`}
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deletePlay.mutateAsync(confirmDelete.id)
            setConfirmDelete(null)
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
