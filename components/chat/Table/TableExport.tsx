// components/chat/table/TableExport.tsx
"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface TableExportProps {
  data: any[]
  visibleColumns: string[]
}

export function TableExport({ data, visibleColumns }: TableExportProps) {
  const exportTableData = (format: 'csv' | 'json') => {
    try {
      const visibleData = data.map(row => {
        const newRow: any = {}
        visibleColumns.forEach(col => {
          newRow[col] = row[col]
        })
        return newRow
      })

      let content: string
      let filename: string
      let mimeType: string

      if (format === 'csv') {
        const headers = visibleColumns.join(',')
        const rows = visibleData.map(row => 
          visibleColumns.map(col => 
            typeof row[col] === 'string' ? `"${row[col]}"` : row[col]
          ).join(',')
        )
        content = [headers, ...rows].join('\n')
        filename = 'table-data.csv'
        mimeType = 'text/csv'
      } else {
        content = JSON.stringify(visibleData, null, 2)
        filename = 'table-data.json'
        mimeType = 'application/json'
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Exported as ${format.toUpperCase()}`, {
        icon: <CheckCircle className="h-4 w-4" />,
      })
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Export failed', {
        icon: <AlertCircle className="h-4 w-4" />,
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => exportTableData('csv')}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportTableData('json')}>
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}