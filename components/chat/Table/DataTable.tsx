// components/chat/DataTable.tsx
"use client"

import { Table } from "@/components/ui/table"
// import { TablePagination } from "./table/TablePagination"
// import { TableExport } from "./table/TableExport"
// import { TableHeader } from "./table/TableHeader"
// import { TableBody } from "./table/TableBody"
import { TablePagination } from "./TablePagination"
import { TableExport } from "./TableExport"
import { TabloeHeading } from "./TableHeading"
import { TableBody } from "./TableBody"
interface TableViewState {
  currentPage: number
  itemsPerPage: number
  searchTerm: string
  hiddenColumns: Set<string>
  sortColumn: string | null
  sortDirection: 'asc' | 'desc'
}

interface DataTableProps {
  data: any[]
  messageIndex: number
  tableViewState: { [key: number]: TableViewState }
  onTableViewStateChange: (messageIndex: number, updates: Partial<TableViewState>) => void
  onRowSelect?: (row: any) => void
}

export function DataTable({
  data,
  messageIndex,
  tableViewState,
  onTableViewStateChange,
  onRowSelect,
}: DataTableProps) {
  const getTableViewState = (messageIndex: number): TableViewState => {
    return tableViewState[messageIndex] || {
      currentPage: 1,
      itemsPerPage: 10,
      searchTerm: "",
      hiddenColumns: new Set(),
      sortColumn: null,
      sortDirection: 'asc'
    }
  }

  const state = getTableViewState(messageIndex)
  const columns = Object.keys(data[0] || {})
  const visibleColumns = columns.filter(col => !state.hiddenColumns.has(col))

  const handleSort = (column: string) => {
    onTableViewStateChange(messageIndex, {
      sortColumn: column,
      sortDirection: state.sortColumn === column && state.sortDirection === 'asc' ? 'desc' : 'asc'
    })
  }

  const toggleColumnVisibility = (column: string) => {
    const newHiddenColumns = new Set(state.hiddenColumns)
    if (newHiddenColumns.has(column)) {
      newHiddenColumns.delete(column)
    } else {
      newHiddenColumns.add(column)
    }
    onTableViewStateChange(messageIndex, { hiddenColumns: newHiddenColumns })
  }

  // Sort and filter data
  const sortedData = [...data].sort((a, b) => {
    if (!state.sortColumn) return 0
    const aValue = a[state.sortColumn]
    const bValue = b[state.sortColumn]
    const modifier = state.sortDirection === 'asc' ? 1 : -1
    return aValue < bValue ? -1 * modifier : aValue > bValue ? 1 * modifier : 0
  }).filter(row => 
    Object.entries(row).some(([key, value]) => 
      String(value).toLowerCase().includes(state.searchTerm.toLowerCase())
    )
  )

  // Pagination
  const totalPages = Math.ceil(sortedData.length / state.itemsPerPage)
  const startIndex = (state.currentPage - 1) * state.itemsPerPage
  const paginatedData = sortedData.slice(startIndex, startIndex + state.itemsPerPage)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <TablePagination
          currentPage={state.currentPage}
          totalPages={totalPages}
          onPageChange={(page) => onTableViewStateChange(messageIndex, { currentPage: page })}
        />
        <TableExport data={data} visibleColumns={visibleColumns} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TabloeHeading
            columns={visibleColumns}
            hiddenColumns={state.hiddenColumns}
            sortColumn={state.sortColumn}
            sortDirection={state.sortDirection}
            onSort={handleSort}
            onToggleColumn={toggleColumnVisibility}
          />
          <TableBody
            data={paginatedData}
            visibleColumns={visibleColumns}
            onRowSelect={onRowSelect}
          />
        </Table>
      </div>
    </div>
  )
}