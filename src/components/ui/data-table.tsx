'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  searchable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  pageSize?: number
  searchPlaceholder?: string
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  pageSize = 10,
  searchPlaceholder = 'Cari data...',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const searchableKeys = columns
    .filter((c) => c.searchable !== false)
    .map((c) => c.key)

  const filteredData = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter((item) =>
      searchableKeys.some((key) => {
        const val = item[key]
        if (val == null) return false
        return String(val).toLowerCase().includes(q)
      })
    )
  }, [data, search, searchableKeys])

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      const cmp = String(aVal).localeCompare(String(bVal), 'id', { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filteredData, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedData = sortedData.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  )

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9 bg-white dark:bg-slate-900"
          />
        </div>
        <span className="text-sm text-slate-500 hidden sm:inline">
          {sortedData.length} data
        </span>
      </div>

      <div className="rounded-lg border bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 dark:bg-slate-800/50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap ${
                      col.sortable !== false ? 'cursor-pointer hover:text-teal-600 select-none' : ''
                    }`}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                  >
                    <span className="flex items-center gap-1">
                      {col.header}
                      {sortKey === col.key && (
                        <span className="text-teal-600">{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    Tidak ada data ditemukan
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                        {col.render ? col.render(item) : (item[col.key] as React.ReactNode) ?? '-'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Halaman {safeCurrentPage} dari {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
