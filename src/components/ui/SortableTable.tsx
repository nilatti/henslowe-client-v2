import { flexRender, type Table } from '@tanstack/react-table'
import { Card } from './Card'

interface SortableTableProps<T> {
  table: Table<T>
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  emptyMessage?: string
}

export function SortableTable<T>({
  table,
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  emptyMessage = 'No results found.',
}: SortableTableProps<T>) {
  return (
    <div>
      {onSearchChange !== undefined && (
        <div className="mb-4">
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={search ?? ''}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
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
        {table.getRowModel().rows.length === 0 && (
          <p className="px-4 py-6 text-sm text-gray-500 text-center">
            {emptyMessage}
          </p>
        )}
      </Card>
    </div>
  )
}
