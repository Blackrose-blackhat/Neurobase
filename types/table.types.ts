
export interface TableViewState {
    currentPage: number
    itemsPerPage: number
    searchTerm: string
    hiddenColumns: Set<string>
    sortColumn: string | null
    sortDirection: 'asc' | 'desc'
  }