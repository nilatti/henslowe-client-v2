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
import { authorsQueryOptions } from '../api/authors'
import { AuthorForm } from './AuthorForm'
import { useIsSuperAdmin } from '../../../hooks/useUserRole'
import { Button, Card, PageHeader } from '../../../components/ui'
import type { Author } from '../types/author'

export function AuthorsList() {
  const { data: authors } = useSuspenseQuery(authorsQueryOptions())
  const isSuperAdmin = useIsSuperAdmin()
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'last_name', desc: false },
  ])
  const [showForm, setShowForm] = useState(false)

  const columnHelper = createColumnHelper<Author>()
  const columns = [
    columnHelper.accessor(
      row => `${row.last_name}, ${row.first_name}`,
      {
        id: 'last_name',
        header: 'Name',
        cell: ({ row }) => (
          <Link
            to="/authors/$authorId"
            params={{ authorId: String(row.original.id) }}
            className="text-blue-600 hover:text-blue-800"
          >
            {[row.original.last_name, row.original.first_name].filter(Boolean).join(', ')}
          </Link>
        ),
      }
    ),
    columnHelper.accessor('birthdate', {
      header: 'Born',
      cell: info => info.getValue() ?? '—',
    }),
    columnHelper.accessor('deathdate', {
      header: 'Died',
      cell: info => info.getValue() ?? '—',
    }),
  ]

  const table = useReactTable({
    data: authors,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div>
      <PageHeader
        title="Authors"
        action={
          isSuperAdmin && !showForm ? (
            <Button onClick={() => setShowForm(true)}>New Author</Button>
          ) : undefined
        }
      />

      {showForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">New Author</h2>
          <AuthorForm
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
        {authors.length === 0 && (
          <p className="px-4 py-6 text-sm text-gray-500 text-center">No authors found.</p>
        )}
      </Card>
    </div>
  )
}
