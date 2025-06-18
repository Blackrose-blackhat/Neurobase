import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Maximize2, X } from "lucide-react";
import { useState } from "react";

interface FullScreenViewProps {
  data: any[];
  columns: string[];
  title?: string;
}

export function FullScreenView({ data, columns, title }: FullScreenViewProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-2 top-2"
        onClick={() => setIsOpen(true)}
      >
        <Maximize2 className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] h-[90vh] p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{title || "Data View"}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-4 overflow-auto h-[calc(90vh-4rem)]">
            <Table>
              <thead className="sticky top-0 bg-background">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="text-left p-2">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx}>
                    {columns.map((column) => (
                      <td key={column} className="p-2">
                        <div className="max-w-[300px]">
                          {formatCellValue(row[column])}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
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