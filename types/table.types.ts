export interface TableViewState {
    page: number
    pageSize: number
    searchTerm: string
    hiddenColumns: Set<string>
    sortColumn: string
    sortDirection: 'asc' | 'desc'
  }