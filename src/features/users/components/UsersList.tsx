import { useState, useMemo } from 'react'
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
import { usersQueryOptions, useDeleteUser } from '../api/users'
import type { UserSummary } from '../types/user'
import { buildUserName } from '../../../utils/actorUtils'
import { Button, ConfirmDialog, PageHeader, SortableTable } from '../../../components/ui'
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
  const { target: confirmDelete, open: requestDelete, close: clearDelete } = useConfirmDelete<UserSummary>()
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
              onClick={() => requestDelete(row.original)}
            >
              Delete
            </Button>
          </div>
        ),
      }),
    ] : []),
  ], [isSuperAdmin])

  const filteredUsers = useMemo(() =>
    (users as Array<UserSummary & { fake?: boolean }>).filter(u => {
      if (u.fake) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        u.first_name?.toLowerCase().includes(q) ||
        u.last_name?.toLowerCase().includes(q) ||
        u.preferred_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      )
    }),
    [users, search]
  )

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
      <SortableTable
        table={table}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or email…"
        emptyMessage={search ? 'No users match your search.' : 'No users found.'}
      />

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete ${buildUserName(confirmDelete)}? This cannot be undone.`}
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deleteUser.mutateAsync(confirmDelete.id)
            clearDelete()
          }}
          onCancel={clearDelete}
        />
      )}
    </div>
  )
}
