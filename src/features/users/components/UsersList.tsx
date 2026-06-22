import { useState, useMemo } from 'react'
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
import { usersQueryOptions, useDeleteUser } from '../api/users'
import type { UserSummary } from '../types/user'
import { buildUserName } from '../../../utils/actorUtils'
import { Button, Card, ConfirmDialog, PageHeader } from '../../../components/ui'
import { useIsSuperAdmin } from '../../../hooks/useUserRole'

const columnHelper = createColumnHelper<UserSummary>()

export function UsersList() {
  const { data: users } = useSuspenseQuery(usersQueryOptions())
  const deleteUser = useDeleteUser()
  const isSuperAdmin = useIsSuperAdmin()
  const navigate = useNavigate()

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'last_name', desc: false },
  ])
  const [confirmDelete, setConfirmDelete] = useState<UserSummary | null>(null)
  const [search, setSearch] = useState('')

  const columns = useMemo(() => [
    columnHelper.accessor(
      row => `${row.last_name} ${row.first_name}`,
      {
        id: 'last_name',
        header: 'Name',
        cell: ({ row }) => (
          <Link
            to="/users/$userId"
            params={{ userId: String(row.original.id) }}
            className="text-blue-600 hover:text-blue-800"
          >
            {buildUserName(row.original)}
          </Link>
        ),
      }
    ),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: info => (
        <a
          href={`mailto:${info.getValue()}`}
          className="text-gray-600 hover:text-gray-900"
        >
          {info.getValue()}
        </a>
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
  ], [isSuperAdmin])

  const filteredUsers = (users as Array<UserSummary & { fake?: boolean }>).filter(u => {
    if (u.fake) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q) ||
      u.preferred_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    )
  })

  const table = useReactTable({
    data: filteredUsers,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div>
      <PageHeader
        title="Users"
        action={isSuperAdmin ? (
          <Button onClick={() => navigate({ to: '/users/new' })}>
            Add person
          </Button>
        ) : undefined}
      />
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
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
        {table.getRowModel().rows.length === 0 && (
          <p className="px-4 py-6 text-sm text-gray-500 text-center">
            {search ? 'No users match your search.' : 'No users found.'}
          </p>
        )}
      </Card>

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete ${buildUserName(confirmDelete)}? This cannot be undone.`}
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            const id = confirmDelete.id
            await deleteUser.mutateAsync(id)
            setConfirmDelete(prev => prev?.id === id ? null : prev)
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
