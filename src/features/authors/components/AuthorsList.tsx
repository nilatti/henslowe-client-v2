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
import { authorsQueryOptions } from '../api/authors'
import { AuthorForm } from './AuthorForm'
import { useIsSuperAdmin } from '../../../hooks/useUserRole'
import { Button, Card, PageHeader, SortableTable } from '../../../components/ui'
import type { Author } from '../types/author'

export function AuthorsList() {
  const { data: authors } = useSuspenseQuery(authorsQueryOptions())
  const isSuperAdmin = useIsSuperAdmin()
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'last_name', desc: false },
  ])
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  const filteredAuthors = useMemo(() => {
    if (!search) return authors
    const q = search.toLowerCase()
    return authors.filter(a =>
      a.first_name?.toLowerCase().includes(q) ||
      a.last_name?.toLowerCase().includes(q)
    )
  }, [authors, search])

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
    data: filteredAuthors,
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

      <SortableTable
        table={table}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search authors…"
        emptyMessage={search ? 'No authors match your search.' : 'No authors found.'}
      />
    </div>
  )
}
