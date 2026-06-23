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
import { playsQueryOptions, useDeletePlay } from '../api/plays'
import { type PlayListItem } from '../types/play'
import { PlayForm } from './PlayForm'
import { useIsSuperAdmin } from '../../../hooks/useUserRole'
import { Button, Card, ConfirmDialog, PageHeader, SortableTable } from '../../../components/ui'

export function PlaysList() {
  usePageTitle('Plays')
  const { data: plays } = useSuspenseQuery(playsQueryOptions())
  const deletePlay = useDeletePlay()
  const isSuperAdmin = useIsSuperAdmin()
  const navigate = useNavigate()

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'title', desc: false },
  ])
  const [showForm, setShowForm] = useState(false)
  const { target: confirmDelete, open: requestDelete, close: clearDelete } = useConfirmDelete<PlayListItem>()
  const [search, setSearch] = useState('')

  const filteredPlays = useMemo(() => {
    if (!search) return plays
    const q = search.toLowerCase()
    return plays.filter(p => p.title?.toLowerCase().includes(q))
  }, [plays, search])

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
              onClick={() => requestDelete(row.original)}
            >
              Delete
            </Button>
          </div>
        ),
      }),
    ] : []),
  ]

  const table = useReactTable({
    data: filteredPlays,
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

      <SortableTable
        table={table}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search plays…"
        emptyMessage={search ? 'No plays match your search.' : 'No plays found.'}
      />

      {confirmDelete && (
        <ConfirmDialog
          message={`Delete "${confirmDelete.title}"? This will delete all acts, scenes, characters and lines.`}
          isDestructive
          confirmLabel="Delete"
          onConfirm={async () => {
            await deletePlay.mutateAsync(confirmDelete.id)
            clearDelete()
          }}
          onCancel={clearDelete}
        />
      )}
    </div>
  )
}
