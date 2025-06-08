// components/chat/table/TableHeader.tsx
"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, EyeOff } from "lucide-react"
import { TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface TableHeaderProps {
  columns: string[]
  hiddenColumns: Set<string>
  sortColumn: string | null
  sortDirection: 'asc' | 'desc'
  onSort: (column: string) => void
  onToggleColumn: (column: string) => void
}

export function TabloeHeading({
  columns,
  hiddenColumns,
  sortColumn,
  sortDirection,
  onSort,
  onToggleColumn,
}: TableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        {columns.map((column) => (
          <TableHead key={column} className="relative">
            <div className="flex items-center gap-2">
              <span
                className="cursor-pointer"
                onClick={() => onSort(column)}
              >
                {column}
                {sortColumn === column && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onToggleColumn(column)}>
                    {hiddenColumns.has(column) ? (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Show Column
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Hide Column
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  )
}