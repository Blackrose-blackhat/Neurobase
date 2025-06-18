// components/chat/DataTable.tsx
"use client"

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableViewState } from "@/types/table.types";
import { RowDetails } from "./RowDetails";

interface DataTableProps {
  data: any[];
  messageIndex: number;
  tableViewState: { [key: number]: TableViewState };
  onTableViewStateChange: (
    messageIndex: number,
    updates: Partial<TableViewState>
  ) => void;
  onRowSelect: (row: any) => void;
}

export function DataTable({
  data,
  messageIndex,
  tableViewState,
  onTableViewStateChange,
  onRowSelect,
}: DataTableProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRow, setSelectedRow] = useState<any>(null);

  // Get all unique columns from the data
  const allColumns = Array.from(
    new Set(data.flatMap((item) => Object.keys(item)))
  );

  // Initialize selected columns if not set
  if (selectedColumns.length === 0 && allColumns.length > 0) {
    setSelectedColumns(allColumns.slice(0, 5)); // Default to first 5 columns
  }

  // Filter data based on search term
  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Get current view state
  const currentState = tableViewState[messageIndex] || {
    page: 1,
    pageSize: 10,
    sortColumn: "",
    sortDirection: "asc",
  };

  // Calculate pagination
  const startIndex = (currentState.page - 1) * currentState.pageSize;
  const endIndex = startIndex + currentState.pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Handle column selection
  const handleColumnSelect = (columns: string[]) => {
    setSelectedColumns(columns);
  };

  // Handle sorting
  const handleSort = (column: string) => {
    const newDirection =
      currentState.sortColumn === column && currentState.sortDirection === "asc"
        ? "desc"
        : "asc";

    onTableViewStateChange(messageIndex, {
      sortColumn: column,
      sortDirection: newDirection,
    });
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select
            value={selectedColumns.join(",")}
            onValueChange={(value) => handleColumnSelect(value.split(","))}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select columns" />
            </SelectTrigger>
            <SelectContent>
              {allColumns.map((column) => (
                <SelectItem key={column} value={column}>
                  {column}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative">
        <Table>
          <TableHeader>
            <TableRow>
              {selectedColumns.map((column) => (
                <TableHead
                  key={column}
                  className="cursor-pointer"
                  onClick={() => handleSort(column)}
                >
                  {column}
                  {currentState.sortColumn === column && (
                    <span className="ml-1">
                      {currentState.sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                className="cursor-pointer hover:bg-muted"
                onClick={() => setSelectedRow(row)}
              >
                {selectedColumns.map((column) => (
                  <TableCell key={column}>
                    <div className="max-w-[200px] truncate">
                      {formatCellValue(row[column])}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {selectedRow && (
          <RowDetails
            row={selectedRow}
            isOpen={!!selectedRow}
            onClose={() => setSelectedRow(null)}
          />
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onTableViewStateChange(messageIndex, {
                page: Math.max(1, currentState.page - 1),
              })
            }
            disabled={currentState.page === 1}
          >
            Previous
          </Button>
          <span>
            Page {currentState.page} of{" "}
            {Math.ceil(filteredData.length / currentState.pageSize)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onTableViewStateChange(messageIndex, {
                page: currentState.page + 1,
              })
            }
            disabled={
              currentState.page >=
              Math.ceil(filteredData.length / currentState.pageSize)
            }
          >
            Next
          </Button>
        </div>
        <Select
          value={String(currentState.pageSize)}
          onValueChange={(value) =>
            onTableViewStateChange(messageIndex, {
              pageSize: Number(value),
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Page size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 rows</SelectItem>
            <SelectItem value="25">25 rows</SelectItem>
            <SelectItem value="50">50 rows</SelectItem>
            <SelectItem value="100">100 rows</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function formatCellValue(value: any): string {
  if (value === null || value === undefined) return '';
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  
  return String(value);
}