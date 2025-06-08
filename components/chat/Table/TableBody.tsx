// components/chat/table/TableBody.tsx
"use client"

import { TableBody as UITableBody, TableCell, TableRow } from "@/components/ui/table"

interface TableBodyProps {
  data: any[]
  visibleColumns: string[]
  onRowSelect?: (row: any) => void
}

export function TableBody({ data, visibleColumns, onRowSelect }: TableBodyProps) {
  return (
    <UITableBody>
      {data.map((row, rowIndex) => (
        <TableRow
          key={rowIndex}
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => onRowSelect?.(row)}
        >
          {visibleColumns.map((column) => (
            <TableCell key={column}>
              {String(row[column])}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </UITableBody>
  )
}